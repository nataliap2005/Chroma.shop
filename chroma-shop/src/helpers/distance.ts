export function distance(a: [
    number,
    number
], b: [
    number,
    number
]) {
    const r = Math.PI / 180, d = (b[0] - a[0]) * r, l = (b[1] - a[1]) * r;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(d / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(l / 2) ** 2));
}
