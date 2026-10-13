-- ============================================================================
-- CURALINK PHARMACY PORTAL MIGRATION 0005: STICKER CONFIRMATIONS & ATOMIC DISPENSE
-- ============================================================================

-- 1. Extend prescription_medicines with immutable physician sticker plan and prescribed quantity
ALTER TABLE prescription_medicines
    ADD COLUMN IF NOT EXISTS dose_slots dose_slot[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS before_food BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS quantity_prescribed INT NOT NULL DEFAULT 30;

-- 2. Drop old sticker_assignments and create append-only sticker_confirmations
DROP TABLE IF EXISTS sticker_assignments CASCADE;

CREATE TABLE IF NOT EXISTS sticker_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_medicine_id UUID NOT NULL REFERENCES prescription_medicines(id) ON DELETE RESTRICT,
    confirmed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_sticker_confirmations_medicine UNIQUE (prescription_medicine_id)
);

ALTER TABLE sticker_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow pharmacy and read access to sticker confirmations"
    ON sticker_confirmations FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Allow pharmacy to confirm stickers"
    ON sticker_confirmations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('PHARMACY', 'ADMIN')
        )
    );

-- Enforce immutability on sticker_confirmations (no UPDATE or DELETE)
CREATE TRIGGER trg_sticker_confirmations_prevent_modification
    BEFORE UPDATE OR DELETE ON sticker_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_tampering_audit_and_dispense();

-- 3. Create inventory_batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL UNIQUE,
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on inventory batches"
    ON inventory_batches FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Allow inventory management on batches"
    ON inventory_batches FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('PHARMACY', 'ADMIN')
        )
    );

-- 4. Create inventory_movements table (append-only ledger)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DISPENSE', 'RESTOCK', 'ADJUSTMENT')),
    quantity_changed INT NOT NULL,
    quantity_after INT NOT NULL CHECK (quantity_after >= 0),
    reason TEXT,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read on inventory movements"
    ON inventory_movements FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Allow insert on inventory movements"
    ON inventory_movements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('PHARMACY', 'ADMIN')
        )
    );

CREATE TRIGGER trg_inventory_movements_prevent_modification
    BEFORE UPDATE OR DELETE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION prevent_tampering_audit_and_dispense();

-- 5. Stored Procedure: dispense_prescription (Atomic Whole-Prescription Dispense RPC)
CREATE OR REPLACE FUNCTION dispense_prescription(
    p_prescription_id UUID,
    p_patient_id UUID,
    p_items JSONB,
    p_idempotency_key TEXT,
    p_dispensed_by UUID,
    p_pharmacy_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_event RECORD;
    v_receipt_no TEXT;
    v_item JSONB;
    v_med_id UUID;
    v_batch_num TEXT;
    v_qty INT;
    v_exp DATE;
    v_med_name TEXT;
    v_item_id UUID;
    v_current_item_qty INT;
    v_current_batch_qty INT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Idempotency Check
    SELECT receipt_no INTO v_receipt_no
    FROM dispense_events
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_receipt_no IS NOT NULL THEN
        RETURN jsonb_build_object(
            'receiptNo', v_receipt_no,
            'isIdempotentReplay', TRUE,
            'itemsDispensed', jsonb_array_length(p_items)
        );
    END IF;

    -- 2. Generate Receipt Number (e.g. RCP-YYYYMMDD-HEX)
    v_receipt_no := 'RCP-' || to_char(v_now, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

    -- 3. Iterate over items with row locking
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_med_id := (v_item->>'prescriptionMedicineId')::UUID;
        v_batch_num := v_item->>'batchNumber';
        v_qty := (v_item->>'quantity')::INT;
        v_exp := (v_item->>'expiryDate')::DATE;

        -- Fetch medicine line details
        SELECT medicine_name INTO v_med_name
        FROM prescription_medicines
        WHERE id = v_med_id;

        IF v_med_name IS NULL THEN
            RAISE EXCEPTION 'Medicine line % does not exist in prescription %', v_med_id, p_prescription_id;
        END IF;

        -- Lock and check batch
        SELECT id, inventory_item_id, stock_quantity, expiry_date
        INTO v_item_id, v_current_batch_qty
        FROM inventory_batches
        WHERE batch_number = v_batch_num
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Batch % not found for medicine %', v_batch_num, v_med_name;
        END IF;

        IF v_current_batch_qty < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock in batch %: requested %, available %', v_batch_num, v_qty, v_current_batch_qty;
        END IF;

        IF v_exp < CURRENT_DATE THEN
            RAISE EXCEPTION 'Batch % is expired (expiry: %)', v_batch_num, v_exp;
        END IF;

        -- Lock and update parent inventory item
        SELECT stock_quantity INTO v_current_item_qty
        FROM inventory_items
        WHERE id = v_item_id
        FOR UPDATE;

        IF v_current_item_qty < v_qty THEN
            RAISE EXCEPTION 'Insufficient total stock for %: requested %, available %', v_med_name, v_qty, v_current_item_qty;
        END IF;

        -- Decrement batch stock
        UPDATE inventory_batches
        SET stock_quantity = stock_quantity - v_qty
        WHERE batch_number = v_batch_num;

        -- Decrement item stock
        UPDATE inventory_items
        SET stock_quantity = stock_quantity - v_qty,
            last_updated_at = v_now
        WHERE id = v_item_id;

        -- Insert inventory movement
        INSERT INTO inventory_movements (
            inventory_item_id,
            medicine_name,
            batch_number,
            type,
            quantity_changed,
            quantity_after,
            reason,
            performed_by,
            timestamp
        ) VALUES (
            v_item_id,
            v_med_name,
            v_batch_num,
            'DISPENSE',
            -v_qty,
            v_current_item_qty - v_qty,
            'Prescription Dispensed: ' || v_receipt_no,
            p_dispensed_by,
            v_now
        );

        -- Insert dispense event
        INSERT INTO dispense_events (
            prescription_medicine_id,
            prescription_id,
            patient_id,
            pharmacy_id,
            medicine_name,
            batch_number,
            expiry_date,
            quantity,
            receipt_no,
            status,
            idempotency_key,
            dispensed_by,
            dispensed_at
        ) VALUES (
            v_med_id,
            p_prescription_id,
            p_patient_id,
            p_pharmacy_id,
            v_med_name,
            v_batch_num,
            v_exp,
            v_qty,
            v_receipt_no,
            'DISPENSED',
            p_idempotency_key || ':' || v_med_id,
            p_dispensed_by,
            v_now
        );
    END LOOP;

    -- 4. Audit Log
    INSERT INTO audit_logs (
        actor_id,
        actor_role,
        action_type,
        target_entity,
        target_id,
        timestamp,
        metadata
    ) VALUES (
        p_dispensed_by,
        'PHARMACY',
        'MEDICINE_DISPENSED',
        'Prescription',
        p_prescription_id::TEXT,
        v_now,
        jsonb_build_object(
            'receiptNo', v_receipt_no,
            'itemsCount', jsonb_array_length(p_items),
            'idempotencyKey', p_idempotency_key
        )
    );

    RETURN jsonb_build_object(
        'receiptNo', v_receipt_no,
        'isIdempotentReplay', FALSE,
        'itemsDispensed', jsonb_array_length(p_items)
    );
END;
$$;
