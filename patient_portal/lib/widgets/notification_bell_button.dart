import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../screens/notifications/notifications_screen.dart';

class NotificationBellButton extends StatelessWidget {
  final int unreadCount;
  final bool isTranslucent;

  const NotificationBellButton({
    super.key,
    this.unreadCount = 3,
    this.isTranslucent = false,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Clinical Alerts & Notifications',
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: isTranslucent ? AppTheme.glassSurface : AppTheme.primaryBlueSurface,
              shape: BoxShape.circle,
              border: Border.all(
                color: isTranslucent ? AppTheme.glassBorder : AppTheme.primaryBlueBorder,
                width: 1.2,
              ),
            ),
            child: Icon(
              Icons.notifications_outlined,
              size: 20,
              color: isTranslucent ? Colors.white : AppTheme.primaryBlue,
            ),
          ),
          if (unreadCount > 0)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: isTranslucent ? AppTheme.accentLime : const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isTranslucent ? AppTheme.accentLimeDark : Colors.white,
                    width: 1.5,
                  ),
                ),
                constraints: const BoxConstraints(
                  minWidth: 16,
                  minHeight: 16,
                ),
                child: Center(
                  child: Text(
                    unreadCount > 9 ? '9+' : '$unreadCount',
                    style: TextStyle(
                      color: isTranslucent ? AppTheme.accentLimeDark : Colors.white,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
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
