import type { WeaponType } from './entities/weapons/weapon';
import { Application, Ticker } from 'pixi.js';
import { loadGameTextures } from './assets/loadGameTextures';
import { GameScene } from './scenes/GameScene';
import { Input } from './systems/Input';
import { AudioManager } from './systems/Audio';
import backgroundMusic from './assets/sound/Glorious Morning.mp3';
import type { JoinedPayload, Vec2 } from '../types/game';
import type { Socket } from 'socket.io-client';
import type { HarvestableTile } from './world/tileResource';
import type { CastleAttackStarted } from '../types/game';

export class Game {
    readonly app: Application;
    readonly input = new Input();
    readonly audio = new AudioManager();

    private scene?: GameScene;

    private readonly handleTick = (ticker: Ticker) => {
        if (!this.scene) return;

        const deltaSeconds = ticker.deltaMS / 1000;
        this.scene.player.weapon?.update(deltaSeconds);
        for (const enemy of this.scene.remotePlayers.values()) {
            enemy.weapon?.update(deltaSeconds);
            enemy.updateHitAnimation(deltaSeconds);
        }
        this.scene.update(
            this.input.state,
            this.app.renderer.width,
            this.app.renderer.height,
            deltaSeconds
        );
    };

    constructor() {
        this.app = new Application();
        this.input.Attack = () => {
            this.scene?.requestattack();
        };
        this.input.Castleranged = () => {
            this.scene?.castleranged();
        };
    }

    equipWeapon(weapon: WeaponType | null) {
        this.scene?.player.equipWeapon(weapon);
    }
    equipremoteweapon(socketId: string, weapon: WeaponType) {
        this.scene?.remotePlayers.get(socketId)?.equipWeapon(weapon);
    }
    addRemotePlayer(player: JoinedPayload['players'][number]) {
        this.scene?.addRemotePlayer(player);
    }

    addRemoteCastle(player: JoinedPayload['players'][number]) {
        this.scene?.addRemoteCastle(player);
    }

    removeRemoteCastle(player: JoinedPayload['players'][number]) {
        this.scene?.removeRemoteCastle(player);
    }

    removeRemotePlayer(player: JoinedPayload['players'][number]) {
        this.scene?.removeRemotePlayer(player);
    }

    updateRemotePlayer(
        socketId: string,
        x: number,
        y: number,
        moving: boolean
    ) {
        this.scene?.updateRemotePlayer(socketId, x, y, moving);
    }

    RemotePlayerattack(
        socketId: string,
        direction: 'up' | 'down' | 'left' | 'right'
    ): void {
        this.scene?.RemotePlayerattack(socketId, direction);
    }

    correctLocalPlayer(x: number, y: number) {
        this.scene?.correctLocalPlayer(x, y);
    }

    removeResourceTile(x: number, y: number) {
        this.scene?.removeResourceTile(x, y);
    }

    syncInventory(wood: number, iron: number) {
        this.scene?.syncInventory(wood, iron);
    }

    spawnResourceTile(x: number, y: number, type: HarvestableTile) {
        this.scene?.spawnResourceTile(x, y, type);
    }

    spawnTrebuchet(trebuchetId: string, position: Vec2) {
        this.scene?.spawnTrebuchet(trebuchetId, position);
    }

    breakTrebuchet(trebuchetId: string) {
        this.scene?.breakTrebuchet(trebuchetId);
    }

    fireTrebuchet(
        trebuchetId: string,
        direction: 'up' | 'down' | 'left' | 'right'
    ) {
        this.scene?.fireTrebuchet(trebuchetId, direction);
    }

    updateTrebuchet(trebuchetId: string, position: Vec2) {
        this.scene?.updateTrebuchet(trebuchetId, position);
    }

    updateTrebuchetHealth(
        trebuchetId: string,
        health: number,
        maxHealth: number
    ) {
        this.scene?.updateTrebuchetHealth(trebuchetId, health, maxHealth);
    }

    updateRemoteCastle(socketId: string, level: number) {
        this.scene?.updateRemoteCastle(socketId, level);
    }

    async start(
        container: HTMLDivElement,
        joinedData: JoinedPayload,
        socket: Socket
    ) {
        await this.app.init({
            resizeTo: window, // Automatically resize canvas with window
            autoDensity: true, // Handle high-DPI displays
            resolution: window.devicePixelRatio || 1 // Device pixel ratio for crisp rendering
        });

        container.appendChild(this.app.canvas);

        const textures = await loadGameTextures();

        this.scene = new GameScene(textures, joinedData, socket);

        this.app.stage.addChild(this.scene.world);
        this.app.ticker.add(this.handleTick);

        this.audio.playBackgroundMusic(backgroundMusic);
    }

    destroy() {
        this.app.ticker.remove(this.handleTick);
        this.input.destroy();
        this.audio.stopBackgroundMusic();
        this.audio.destroy();
        this.scene?.clearBoulders();
        this.app.destroy();
    }

    getInventorySnapshot() {
        return this.scene?.player.inventory.snapshot() ?? null;
    }

    getCastlePointerSnapshot() {
        return this.scene?.getCastlePointer() ?? null;
    }

    isPlayerNearCastle(range: number): boolean {
        return this.scene?.isPlayerNearCastle(range) ?? false;
    }

    playerhitanimation() {
        this.scene?.player.hitanimation();
    }
    remoteplayerhitanimation(socketId: string) {
        this.scene?.remotePlayers.get(socketId)?.hitanimation();
    }
    pause() {
        this.app.ticker.stop();
        this.audio.pause();
    }

    resume() {
        this.app.ticker.start();
        void this.audio
            .resume()
            .catch((error: unknown) =>
                console.error('Failed to resume game audio:', error)
            );
    }

    setPlayerDead(): void {
        this.scene?.setPlayerDead();
    }
    respawnLocalPlayer(x: number, y: number): void {
        this.scene?.respawnLocalPlayer(x, y);
    }
    launchboulder(shot: CastleAttackStarted) {
        this.scene?.launchboulder(shot);
    }
    launchTrebuchetShot(
        shot: Pick<CastleAttackStarted, 'start' | 'target' | 'durationMs'>
    ) {
        this.scene?.launchTrebuchetShot(shot);
    }
    updateCastleHealth(playerSlot: number, health: number, level: number) {
        this.scene?.updateCastleHealth(playerSlot, health, level);
    }
}
