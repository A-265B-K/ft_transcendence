export class AudioManager {
    private readonly soundEffects = new Map<string, HTMLAudioElement[]>();
    private readonly lastVariant = new Map<string, number>();
    private readonly activeEffects = new Set<HTMLAudioElement>();
    private backgroundMusic?: HTMLAudioElement;

    addSoundEffect(name: string, source: string): void {
        if (!name.trim() || !source.trim()) {
            throw new Error('Sound effect name and source are required');
        }

        const template = new Audio(source);
        template.preload = 'auto';

        const variants = this.soundEffects.get(name);
        if (variants) {
            variants.push(template);
        } else {
            this.soundEffects.set(name, [template]);
        }
    }

    hasSoundEffect(name: string): boolean {
        return this.soundEffects.has(name);
    }

    async playSoundEffect(name: string, volume = 1): Promise<void> {
        const effect = this.pickVariant(name).cloneNode(
            true
        ) as HTMLAudioElement;
        effect.volume = Math.max(0, Math.min(1, volume));
        this.activeEffects.add(effect);
        effect.addEventListener(
            'ended',
            () => this.activeEffects.delete(effect),
            { once: true }
        );

        try {
            await effect.play();
        } catch (error) {
            this.activeEffects.delete(effect);
            throw error;
        }
    }

    private pickVariant(name: string): HTMLAudioElement {
        const variants = this.soundEffects.get(name);
        if (!variants || variants.length === 0) {
            throw new Error(`Unknown sound effect: ${name}`);
        }

        let index = Math.floor(Math.random() * variants.length);
        if (variants.length > 1 && index === this.lastVariant.get(name)) {
            index = (index + 1) % variants.length;
        }
        this.lastVariant.set(name, index);

        return variants[index]!;
    }

    async playBackgroundMusic(source: string): Promise<void> {
        if (!source.trim()) {
            throw new Error('Background music source is required');
        }

        if (
            this.backgroundMusic?.src === new URL(source, document.baseURI).href
        ) {
            await this.backgroundMusic.play();
            return;
        }

        this.stopBackgroundMusic();

        const music = new Audio(source);
        music.loop = true;
        this.backgroundMusic = music;

        try {
            await music.play();
        } catch (error) {
            if (this.backgroundMusic === music) {
                this.backgroundMusic = undefined;
            }
            throw error;
        }
    }

    pause(): void {
        this.backgroundMusic?.pause();
        for (const effect of this.activeEffects) {
            effect.pause();
        }
    }

    async resume(): Promise<void> {
        const sounds = [
            ...(this.backgroundMusic ? [this.backgroundMusic] : []),
            ...this.activeEffects
        ];
        await Promise.all(sounds.map((sound) => sound.play()));
    }

    stopBackgroundMusic(): void {
        this.backgroundMusic?.pause();
        this.backgroundMusic = undefined;
    }

    destroy(): void {
        this.stopBackgroundMusic();

        for (const effect of this.activeEffects) {
            effect.pause();
            effect.currentTime = 0;
        }
        this.activeEffects.clear();
        this.soundEffects.clear();
        this.lastVariant.clear();
    }
}
