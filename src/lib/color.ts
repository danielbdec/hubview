export function getReadableTextColor(color: string): '#0F172A' | '#FFFFFF' {
    const normalized = color.trim().replace('#', '');

    if (normalized.length !== 3 && normalized.length !== 6) {
        return '#0F172A';
    }

    const expanded = normalized.length === 3
        ? normalized.split('').map((char) => `${char}${char}`).join('')
        : normalized;

    const r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
    const g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
    const b = Number.parseInt(expanded.slice(4, 6), 16) / 255;

    const toLinear = (channel: number) => (
        channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
    );

    const luminance = (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));

    return luminance > 0.46 ? '#0F172A' : '#FFFFFF';
}
