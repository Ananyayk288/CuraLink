import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../screens/notifications/notifications_screen.dart';

class NotificationBellButton extends StatelessWidget {
  final int unreadCount;

  const NotificationBellButton({
    super.key,
    this.unreadCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Clinical Alerts & Notifications',
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlueSurface,
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.primaryBlueBorder, width: 1),
            ),
            child: const Icon(
              Icons.notifications_outlined,
              size: 18,
              color: AppTheme.primaryBlue,
            ),
          ),
          if (unreadCount > 0)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                constraints: const BoxConstraints(
                  minWidth: 14,
                  minHeight: 14,
                ),
                child: Center(
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      height: 1,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      onPressed: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
      ),
    );
  }
}
