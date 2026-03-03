export function getDeviceOs(): string {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/windows phone/i.test(userAgent)) return 'Windows Phone';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'iOS';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Win/.test(userAgent)) return 'Windows';
    if (/Linux/.test(userAgent)) return 'Linux';

    return 'Unknown OS';
}

export function getDeviceType(): 'Mobile' | 'Desktop' | 'Tablet' {
    const userAgent = navigator.userAgent;

    // Tablet detection (basic)
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return 'Tablet';
    }

    // Mobile detection
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return 'Mobile';
    }

    return 'Desktop';
}

export function getBrowserName(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.indexOf("Firefox") > -1) return "Firefox";
    if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) return "Opera";
    if (userAgent.indexOf("Trident") > -1) return "Internet Explorer";
    if (userAgent.indexOf("Edge") > -1) return "Edge";
    if (userAgent.indexOf("Chrome") > -1) return "Chrome";
    if (userAgent.indexOf("Safari") > -1) return "Safari";

    return "Unknown Browser";
}
