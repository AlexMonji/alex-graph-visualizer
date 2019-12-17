export function DotProduct(vec1, vec2) {
    return vec1[0]*vec2[0] + vec1[1]*vec2[1];
}

export function Clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

export function Fade(t){
    return t*t*t*(6*t*t-(15*t)+10); //6t^5 -15t^4+10t^3
}