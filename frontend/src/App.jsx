import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export default function App() {
  const ref = useRef(null);

  useEffect(() => {
    let app;

    const keys = {};

    const run = async () => {
      app = new PIXI.Application();

      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: 0x1e1e1e,
      });

      ref.current.appendChild(app.canvas);

      // PLAYER
      const player = new PIXI.Graphics();
      player.beginFill(0x00ff00);
      player.drawRect(0, 0, 50, 50);
      player.endFill();

      app.stage.addChild(player);

      player.x = 100;
      player.y = 100;

      // INPUT
      window.addEventListener("keydown", (e) => (keys[e.key] = true));
      window.addEventListener("keyup", (e) => (keys[e.key] = false));

      // GAME LOOP
      app.ticker.add(() => {
        const speed = 5;

        if (keys["w"]) player.y -= speed;
        if (keys["s"]) player.y += speed;
        if (keys["a"]) player.x -= speed;
        if (keys["d"]) player.x += speed;
      });
    };

    run();

    return () => {
      if (app) app.destroy(true);
    };
  }, []);

  return <div ref={ref} />;
}