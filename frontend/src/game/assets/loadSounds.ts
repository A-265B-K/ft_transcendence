import type { AudioManager } from '../systems/Audio';

const soundFiles = import.meta.glob<string>(
    '../../assets/sound/*/**/*.{wav,mp3,ogg}',
    { eager: true, query: '?url', import: 'default' }
);

export const Sound = {
    footstep: 'footstep',
    gatherWood: 'gather_wood',
    gatherIron: 'gather_iron',
    swordHit: 'sword',
    trebuchetPullback: 'trebuchet_pullback',
    trebuchetFire: 'trebuchet_fire',
    trebuchetImpact: 'trebuchet_impact',
    trebuchetDeath: 'trebuchet_death',
    buildingDeath: 'building_death',
    playerDeath: 'player_death'
} as const;

export type SoundName = (typeof Sound)[keyof typeof Sound];

function soundNameFromPath(path: string): string {
    const fileName = path.split('/').pop() ?? path;
    return fileName.replace(/\.[^.]+$/, '').replace(/\d+$/, '');
}

export function loadSounds(audio: AudioManager): void {
    for (const [path, url] of Object.entries(soundFiles)) {
        audio.addSoundEffect(soundNameFromPath(path), url);
    }

    for (const name of Object.values(Sound)) {
        if (!audio.hasSoundEffect(name)) {
            console.warn(`Sound effect "${name}" has no audio files`);
        }
    }
}
