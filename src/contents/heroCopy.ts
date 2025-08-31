// src/contents/heroCopy.ts

export type HeroPoemVariant = {
    long: string[];   // 기본(여유 있는 화면)
    short?: string[]; // 좁은 화면(≤270px)
    ultra?: string[]; // 초협폭(≤240px)
};

export type HeroPoem = {
    id: string;                // 고유 ID (캠페인/고정 노출시 사용)
    enabled?: boolean;         // 끄고 켜기
    weight?: number;           // 가중 랜덤(기본 1)
    variants: HeroPoemVariant; // 화면폭별 문구
    tags?: string[];           // 관리용 태그(선택)
};

/** ─────────────────────────────────────────────────────────────
 *  여기에 포엠(시 묶음)을 계속 추가하면 됨
 *  lines 배열은 줄 단위로 렌더되고, ""는 문단 사이 공백 줄
 *  필요시 short/ultra만 비워두면 자동으로 상위 버전으로 폴백됨
 *  ──────────────────────────────────────────────────────────── */
export const HERO_POEMS: HeroPoem[] = [
    {
        id: "poem-1-prep-and-resonance",
        enabled: true,
        weight: 1,
        variants: {
            long: [
                "아무도 보지 않는 순간에도",
                "우린 노래합니다.",
                "",
                "무대의 불이 꺼진 뒤에도",
                "우린 울림을 담습니다.",
            ],
            short: [
                "아무도 보지 않는 순간에도",
                "우린 노래합니다.",
                "",
                "무대의 불이 꺼진 뒤에도",
                "우린 울림을 담습니다.",
            ],
            ultra: ["무대 뒤에서", "우린 울림을 담습니다."],
        },
        tags: ["무대뒤", "여운", "준비"],
    },
    {
        id: "poem-2-black-billed-lamp",
        enabled: true,
        weight: 1,
        variants: {
            long: [
                "이곳은,", "보편의 무대가 아닌",
                "검은 부리 갈매기가 앉은 가로등 위.",
                "",
                "익숙한 빛을 거부하고",
                "자신만의 노래로",
                "밤을 건너는 이들을 위한 공간입니다.",
            ],
            short: [
                "이곳은,",
                "보편의 무대가 아닌",
                "검은 부리 갈매기의 가로등.",
                "",
                "자신만의 노래로",
                "밤을 건너는 이들을 위한 공간입니다.",
            ],
            ultra: ["검은 부리", "가로등 위"],
        },
        tags: ["정체성", "검은부리", "가로등"],
    },
    // {
    //     id: "poem-3-내아이디",
    //     enabled: true,
    //     weight: 1,
    //     variants: {
    //         long: ["줄1", "줄2", "", "줄3"],
    //         short: ["짧은 줄1", "짧은 줄2"],
    //         ultra: ["초간결1", "초간결2"]
    //     },
    //     tags: ["관리용", "키워드"]
    // }

];

/** ─────────────────────────────────────────────────────────────
 *  랜덤 선택 로직
 *  - 기본 seed: 오늘 날짜(YYYY-MM-DD) → 하루 동안은 같은 포엠 유지
 *  - preferId로 특정 포엠을 강제할 수 있음(캠페인/AB테스트)
 *  - width로 long/short/ultra 자동 선택(≤240/≤270 기준)
 *  ──────────────────────────────────────────────────────────── */
export function pickHeroCopy(
    width: number,
    opts?: { preferId?: string; seed?: string | number }
): string[] {
    const enabled = HERO_POEMS.filter((p) => p.enabled !== false);
    if (enabled.length === 0) return [];

    // 특정 포엠 강제
    if (opts?.preferId) {
        const found = enabled.find((p) => p.id === opts.preferId);
        if (found) return pickByWidth(found.variants, width);
    }

    // 기본 seed: 오늘 날짜로 고정(매일 다른 포엠, 새로고침에도 동일)
    const defaultSeed = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const rand = mulberry32(xmur3(String(opts?.seed ?? defaultSeed))());

    // 가중치 합산
    const totalWeight = enabled.reduce(
        (sum, p) => sum + (p.weight ?? 1),
        0
    );
    let r = rand() * totalWeight;
    let chosen: HeroPoem = enabled[0];
    for (const p of enabled) {
        r -= p.weight ?? 1;
        if (r <= 0) {
            chosen = p;
            break;
        }
    }
    return pickByWidth(chosen.variants, width);
}

// 화면 폭에 따른 버전 선택 + 폴백
function pickByWidth(variant: HeroPoemVariant, width: number): string[] {
    if (width <= 240 && variant.ultra) return variant.ultra;
    if (width <= 270 && variant.short) return variant.short;
    return variant.long ?? variant.short ?? variant.ultra ?? [];
}

/** ─────────────────────────────────────────────────────────────
 *  경량 시드 기반 PRNG (xmur3 → mulberry32)
 *  외부 의존성 없이 안정적 랜덤 선택을 위해 사용
 *  ──────────────────────────────────────────────────────────── */
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return h >>> 0;
    };
}
function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
