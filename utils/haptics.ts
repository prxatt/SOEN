export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
        try {
            switch (type) {
                case 'light':
                    window.navigator.vibrate(50);
                    break;
                case 'medium':
                    window.navigator.vibrate(100);
                    break;
                case 'heavy':
                    window.navigator.vibrate(200);
                    break;
                case 'success':
                    window.navigator.vibrate([100, 50, 100]);
                    break;
                case 'warning':
                    window.navigator.vibrate([200, 50, 100]);
                    break;
                case 'error':
                    window.navigator.vibrate([100, 50, 100, 50, 200]);
                    break;
                default:
                    window.navigator.vibrate(50);
            }
        } catch (e) {
            console.warn("Haptic feedback failed", e);
        }
    }
};
