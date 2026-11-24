export class AudioManager {
    private readonly soundEffects = new Map<string, string>();
    private readonly activeEffects = new Set<HTMLAudioElement>();
    private backgroundMusic?: HTMLAudioElement;

    addSoundEffect(name: string, source: string): void {
        if (!name.trim() || !source.trim()) {
            throw new Error('Sound effect name and source are required');
        }

        this.soundEffects.set(name, source);
    }

    async playSoundEffect(name: string): Promise<void> {
        const source = this.soundEffects.get(name);
        if (!source) {
            throw new Error(`Unknown sound effect: ${name}`);
        }

        const effect = new Audio(source);
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

    async playBackgroundMusic(source: string): Promise<void> {
        if (!source.trim()) {
            throw new Error('Background music source is required');
        }

        if (this.backgroundMusic?.src === new URL(source, document.baseURI).href) {
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
    }
}
