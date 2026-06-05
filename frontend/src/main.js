import { appendSVGPath, Application } from "pixi.js";

(async () => {
  //create app
  const app = new Application();
  //init app
  await app.init({
    resizeTo: window,
    background: '#000000',
  }
  );

  //set margin to 0
  app.canvas.style.position = 'absolute';

  //add canvas
  document.body.appendChild(app.canvas);
})();



