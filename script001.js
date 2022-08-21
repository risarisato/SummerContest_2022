//全体をロードするイベントリスナー
window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas001');
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 400;

  // プレイヤー
  class Player {
    constructor(game) {
      this.game = game;
      // プレイヤーの大きさ
      this.width = 120;
      this.height = 190;
      // プレイヤー位置
      this.x = 20;
      this.y = 100;
      this.speedY = 1;
    }
    update() {
      this.y += this.speedY;
    }
    // context引数を外からもってくるやりかた＝ctx同じ
    draw(context) {
      //context.fillStyle = 'black';//プレイヤーの色→strokeRectでいらない
      context.fillRect(this.x, this.y, this.width, this.height); 塗りつぶし
    }
  }

  // すべてが呼び出されるGameクラス
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
    }
    update() {
      this.player.update();
    }
    draw(context) {
      this.player.draw(context);
    }
  }

  const game = new Game(canvas.width, canvas.height);

  // Gameクラスをアニメーションさせる
  function animate() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);// アニメーションがクリアされる
    game.update();// game.update()に引数deltaTimeを入れる
    game.draw(ctx);
    requestAnimationFrame(animate);
  }
  animate();// animate(0)引数に「0」を入れる
});