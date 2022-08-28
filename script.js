"use strict"
//全体をロードするイベントリスナー
window.addEventListener('load', function(){
    // canvas1の設定
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    // cssで固定画面サイズに対応させているs
    canvas.width =  1000;
    canvas.height = 500;

    // キーボード操作入力
    class InputHandler {
        constructor(game){
            this.game = game;
            window.addEventListener('keydown', e => {
                // if(e.key === 'ArrowUp'){ ['ArrowUp', 'ArrowUp'…上矢印の長押しに対応しない
                if((    (e.key === 'ArrowUp') ||
                        (e.key === 'ArrowDown') ||
                        (e.key === 'ArrowLeft') ||
                        (e.key === 'ArrowRight')
                ) && this.game.keys.indexOf(e.key) === -1){
                    this.game.keys.push(e.key);
                // 入力操作にスペースを追加して攻撃
                } else if ( e.key === ' '){
                    this.game.player.shootTop();
                } else if ( e.key === 'd'){
                    this.game.debug = !this.game.debug;
                }
                //console.log(this.game.keys);
            });
            //上記で「上矢印」で配列に格納されたArrowUpのみspliceで切り取る
            // ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', …となってしまう]
            window.addEventListener('keyup', e =>{
                if(this.game.keys.indexOf(e.key) > -1){
                   this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
                //console.log(this.game.keys);
            });

        }

    }

    // レーザー攻撃:発射物の準備
    class Projectile {
        // コンストラクタ＞newで実行され実行される
        constructor(game, x, y, speed){
            this.game = game;
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.width = 10;
            this.height = 3 ;
            this.markedForDeletion = false;
        }
        update(){
            this.x += this.speed;
            //this.y += this.speed; //斜めにレーザー
            //レーザの距離はwitdth幅*0.95まで
            if (this.x > this.game.width * 0.95) this.markedForDeletion = true;
        }
        draw(context){
            //canvasで描いたもレーザ
            context.fillStyle = 'yellow';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }


    // プレイヤー
    class Player {
        constructor(game){
            this.game = game;
            // プレイヤーの大きさ
            this.width = 40;
            this.height = 70;
            // プレイヤー位置
            this.x = 80;
            this.y = 200;

            // プレイヤー速度初期値
            this.speedY = 0;
            this.speedX = 0;
            // プレイヤー速度
            this.maxSpeed = 5;
            // 発射物の配列
            this.projectiles = [];

            // パワーアップの定義
            this.powerUp = false; // 最初からパワーアップしない
            this.powerUpTimer = 0;
            this.powerUpLimit = 15000;
        }
        // プレイヤーの垂直方向のY速度
        update(deltaTime){
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;

            // プレイヤーの垂直方向のX速度
            if (this.game.keys.includes('ArrowLeft')) this.speedX = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowRight')) this.speedX = this.maxSpeed;
            else this.speedX = 0;
            this.x += this.speedX;

            // プレイヤーが画面上下端までいけないようにする
            if(this.y > this.game.height - this.height * 0.5)
            this.y = this.game.height - this.height *0.5;
            else if (this.y < -this.height *0.5)
            this.y = -this.height * 0.5;

            // プレイヤーが画面左右端までいけいようにする
            if(this.x > this.game.width - this.width * 0.5)
            this.x = this.game.width - this.width *0.5;
            else if (this.x < -this.width *0.5)
            this.x = -this.width * 0.5;

            // 発射物の配列を取り出す＞呼び出す
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            // filter()で通過するすべての要素に新しい配列を提供する
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);


            // プレイヤーのpowerUpアップタイマー
            if(this.powerUp){
                if(this.powerUpTimer > this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.game.ammo += 0.1;
                }
            }
        }
        // context引数を外からもってくるやりかた＝ctx同じ
        draw(context){
            context.fillStyle = 'blue';//プレイヤーの色→strokeRectでいらない
            context.fillRect(this.x, this.y, this.width, this.height);//塗りつぶし
            //x座標, y座標, 半径, 開始位置, 終了位置, 時計回りかどうか
            //context.arc(this.x, this.y, this.width, this.height * Math.PI, false);
            //context.arcTo(this.x, this.y, this.width, this.height * Math.PI, false);
            //context.fill();//→うまくできない

            //デバッグモードの枠線
            if(this.game.debug)
            context.strokeRect(this.x, this.y, this.width, this.height); // 枠線だけ
            // 発射物の配列を取り出す＞呼び出す
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }
        // 準備した発射物を攻撃できる
        shootTop(){
            // 弾薬を無制限で打てないようにする
            if (this.game.ammo > 0){
                //this.projectiles.push(new Projectile(this.game, this.x + 20, this.y));
                this.projectiles.push(new Projectile(
                    this.game,
                    this.x + 20,
                    this.y + 30,
                    this.speed = 7
                    ));
                this.game.ammo--;
            }
            if (this.powerUp) this.shootBottom();
        }
        // パワーアップして、3連打になる
        shootBottom(){
            if (this.game.ammo > 0){
                this.projectiles.push(new Projectile(this.game, this.x - 10, this.y, this.speed = 17));
                this.projectiles.push(new Projectile(this.game, this.x - 10,this.y + 70, this.speed = 6));
                this.projectiles.push(new Projectile(
                    //super(game, x, y, speed)
                    this.game,
                    //this.x - 10,
                    //this.y + 70,
                    this.x += this.speed,
                    this.y += this.speed
                    ));
            }
        }

        // プレイヤーのpowerアップ弾数
        enterPowerUp(){
            this.powerUpTimer = 0;
            this.powerUp = true;
            //this.game.ammo = this.game.maxAmmo;
            // パワーアップ中だけ最大まで残数が増える→終われば定数の残数
            if(this.game.ammo < this.game.maxAmmo)
                this.game.ammo = this.game.maxAmmo;
        }

    }

    // 敵キャラクター(親super)
    class Enemy {
        constructor(game){
            this.game = game;
            this.x = this.game.width;// 敵はX軸方向から来襲
            this.speedX = Math.random() * -1.5  -6.5;
            this.markedForDeletion = false;// レーザに当たるとfalse
        }
        update(){// 敵の水平X軸を調整する
            this.x += this.speedX - this.game.speed;
            if(this.x + this.width < 0) this.markedForDeletion = true;
        }
        draw(context){
            //塗りつぶしと同じ考え
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width * 0.9, this.height * 0.9);
            //context.arc(this.x, this.y, this.width, this.height * Math.PI, false);
            //context.arcTo(this.x, this.y, this.width, this.height * Math.PI, false);
            //context.fill();//→うまくできない

            //四角枠デバックデバッグモードを敵に追加(当たり判定)
            if(this.game.debug)
            context.strokeRect(this.x - 5, this.y - 5, this.width, this.height);
            if(this.game.debug){
            context.font = '20px Helvatica';
            context.fillText(this.lives, this.x, this.y);
            }
        }
    }
    // 継承関係の敵キャラクター(Enemy)オーバライド
    // 同メソッド再宣言して、継承されている場所を自動探し、コードの繰り返しを減らす
    class Angler1 extends Enemy {
        //setColor(Color,black)
        //color = 'black';
        //fillStyle = 'black';
        //constructor(game, setColor, context, fillStyle, color, fillRect ,black){
            //super(game, setColor, context, fillStyle, color, fillRect ,black);
        //constructor(game, ontext = 'black'){
            constructor(game, ontext = 'black'){
            super(game, );
            this.width = 100; //大きさは調整したときの残り
            this.height = 150;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.lives = 100;
            this.score = this.lives;
            //this.setColor = black;
            //this.fillRect = black;
            //this.ontext = ontext;
            //this.context = black;
            //this.color = black;
            //this.fillRect(this.x, this.y, this.width * 0.9, this.height * 0.9);
        }
    }
    // 継承関係の敵キャラクター(Angler2)オーバライド
    // 親クラスで書いているので楽なる
    class Angler2 extends Enemy {
        constructor(game){
            super(game);
            this.width = 213;
            this.height = 165;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.lives = 3;
            this.score = this.lives;
        }
    }
    // 継承関係の敵キャラクター(LuckyFish)オーバライド
    class LuckyFish extends Enemy {
        constructor(game){
            super(game);
            this.width = 99 * 0.5;
            this.height = 95 * 0.5;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            //this.image = document.getElementById('lucky');
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = 7;
            this.type = 'lucky';
        }
    }
    // 継承関係で大型タイプのhivewhaleをオーバライド
    class Hivewhale extends Enemy {
        constructor(game){
            super(game);
            this.width = 400 * 0.9;
            this.height = 227 * 0.9;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            //this.image = document.getElementById('hivewhale');
            this.lives = 20;
            this.score = this.lives;
            this.type = 'hive';
            this.speed = Math.random() * -1.2 -0.2;
        }
    }
    // 継承関係で大型タイプ敵を破壊したあとに小型のDroneをオーバライド
    class Drone extends Enemy {
        constructor(game, x, y){
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = x;
            this.y = y;
            //this.image = document.getElementById('drone');
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = this.lives;
            this.type = 'drone';
            this.speed = Math.random() * -4.2 -0.5;
        }
    }

    // 弾薬数タイマーやカウントダウンを表示
    class UI {
        constructor(game){
            // フィールド情報
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'serif';
            this.color = 'white';
        }
        // 弾薬・スコア点数を描く
        draw(context){
            context.save();// スコープ内のcontextだけ影を開始
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;//影をつけている
            context.shadowOffsetY = 2;//影をつけている
            context.shadowColor = 'black';

            // スコア点数表示
            // this.fontSize + 'px_' スペースがないと変数を読み込まない
            context.font = this.fontSize + 'px ' + this.fontFamily;
            context.fillText('Score: ' + this.game.score, 20, 40);
            context.fillText('弾数: ', 150, 40);


            /* レーザ発射物の残数
            context.fillStyle = this.color;
            if(this.game.player.powerUp) context.fillStyle = '#efffbd';// パワーアップ時の表示の色
            for (let i = 0; i < this.game.ammo; i++){
                // (20, 50)開始位置です。幅は 3 で高さは 20 です。
                // (20 + 5 * i), (50), (3), (20)→カンマ区切り
                context.fillRect( 20 + 5 * i, 50, 3, 20);
                //context.fillText(i , 180, 40);→残数の表示がおかしい
            }
            */
            // ゲームカウントダウン
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);// 小数点で表示
            context.fillText('生存時間: ' + formattedTime, 20, 100);// タイマーを表示させる座標

            // ゲームが終わった時のメッセージ
            if (this.game.gameOver){
                context.textAlin = 'center';
                let message1;
                let message2;
                let message3;
                if (this.game.score > this.game.winningScore){
                    message1 = 'You win!';
                    message2 = '点数：' + this.game.score + 'です！';
                    message3 = '生存時間は：' + formattedTime + 'です！';
                } else {
                    message1 = 'You lose!';
                    message2 = '点数：' + this.game.score + 'です！';
                    message3 = '生存時間は：' + formattedTime + 'です！';
                }
                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message3, this.game.width * 0.5, this.game.height * 0.5 + 60);
            }
            // レーザ発射物の残数がパワーアップ時の色が変更される
            // context.fillStyle = this.color;
            if(this.game.player.powerUp) context.fillStyle = 'red';// パワーアップ時の表示の色
            for (let i = 0; i < this.game.ammo; i++){
                // (20, 50)開始位置です。幅は 3 で高さは 20 です。
                // (20 + 5 * i), (50), (3), (20)→カンマ区切り
                //context.fillText(this.game.ammo + formattedTime, 180, 40);//→残数の表示がおかしい
                context.fillRect( 20 + 5 * i, 50, 3, 20);
                context.fillText(this.game.ammo + formattedTime, 210, 40);//→残数の表示がおかしい
            }
            context.restore();// スコープ内のcontextだけ影を終了
        }
    }

    // すべてのクラスが呼び出される場所
    class Game {
        constructor(width, height){
            this.width = width;
            this.height = height;

            // レイヤー設定したバックグラウンドをオブジェクト化
            //this.background = new Background(this);

            this.player = new Player(this);
            this.input = new InputHandler(this)

            this.ui = new UI(this);//UIの弾薬表示をオブジェクト化
            this.keys = [];//キーボード操作を配列に格納

            //敵の出現は同じもの使用する「弾薬の間隔」があるので
            this.enemies = [];// 敵クラスの配列を宣言
            //this.particles = [];// 敵を倒した残骸歯車
            //this.explosions = [];// 敵を倒した爆発

            this.enemyTimer = 0;// 敵の初期時間は0
            this.enemyInterval = 750;// 敵の出現頻度

            this.ammo = 20;// 弾薬数初期値
            this.maxAmmo = 50; // 弾薬最大値
            this.ammoTimer = 0; // 弾薬タイマー
            this.ammoInterval = 350; // 弾薬インターバル

            this.gameOver = false;

            this.score = 0; // スコア点数の初期値
            this.winningScore = 80; // 勝利スコア

            // ゲームをカウントダウンで終了するゲームにする
            this.gameTime = 0;
            this.timeLimit = 30000;

            this.speed = 3; // 背景バックグラウンド速度
            //this.debug = true;// 最初からデバッグモードが使えるとおかしい
            this.debug = true;
        }
        // 更新する＞＞動くようにみえるところ
        update(deltaTime){
            if (!this.gameOver) this.gameTime += deltaTime;// ゲームをカウントダウン
            if (this.gameTime > this.timeLimit) this.gameOver = true;// ゲームをカウントダウン
            this.player.update(deltaTime);

            //this.background.update();// レイヤー設定したバックグラウンドを更新
            //this.background.layer4.update();// レイヤー4設定したバックグラウンドを更新

            // 弾薬の数が少ないときは回復する
            if (this.ammoTimer > this.ammoInterval){
                if (this.ammo < this.maxAmmo) this.ammo++
                // そうでなければタイマーは0にする
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }

            // 敵クラスとレーザーの関係
            this.enemies.forEach(enemy => {
                enemy.update();
                // 当たり判定、自機プレイヤーと衝突
                if (this.checkCollsion(this.player, enemy)){
                    enemy.markedForDeletion = true;
                    // 敵を倒すと爆風がでる
                    //this.addExplosion(enemy);
                    // 自機とあたり、敵の残骸歯車が3(enemy.score)個でる
                    //for(let i = 0; i < enemy.score; i++){
                    //    this.particles.push(new Particle(this, enemy.x + enemy.width
                    //    * 0.5, enemy.y + enemy.height * 0.5));
                    //}
                    // luckyfishと衝突判定でpowerアップする
                    //if(enemy.type = 'lucky') this.player.enterPowerUp();
                    // ラッキーフィッシュの長方形内に別の敵がいると判定できる
                    if(enemy.type === 'lucky') this.player.enterPowerUp();
                    // ラッキーフィッシュ以外と当たると減点
                    else if (!this.gameOver) this.score--;
                }
                // 当たり判定、レーザ発射物と敵
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollsion(projectile, enemy)){
                        enemy.lives--;
                        projectile.markedForDeletion = true;

                        // 敵に発射物レーザを当てると歯車残骸が1個でる＞＞出さない
                        //this.particles.push(new Particle(this, enemy.x + enemy.width
                        //* 0.5, enemy.y + enemy.height * 0.5));

                        // 敵を発射物レーザーで破壊したとき10(enemy.score)個の残骸→自爆やレーザで歯車残骸の数を変更
                        if (enemy.lives <= 0){
                            for(let i = 0; i < enemy.score; i++){
                                //this.particles.push(new Particle(this, enemy.x +
                                     //enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                            }
                            enemy.markedForDeletion = true;
                            //this.addExplosion(enemy);
                            // 敵が大型のhivewhaleに発射物レーザで倒したら、droneが5匹でる
                            if(enemy.type === 'hive'){
                                for(let i = 0; i < 5; i++){
                                // droneが同じ座標から5匹でないようにする
                                this.enemies.push(new Drone(this,
                                    enemy.x + Math.random() * enemy.width,
                                    enemy.y + Math.random() * enemy.height + 0.5));
                                }
                            }


                            // 発射物レーターにあたり、敵の残骸歯車が10個でる
                            //for(let i = 0; i < 10; i++){
                            //this.particles.push(new Particle(this, enemy.x +
                            //enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                            //this.score+= enemy.score;// カウント完了後に敵を倒しても点数加算される
                            if (!this.gameOver) this.score += enemy.score;// カウント完了後に敵を倒しても点数加算されない
                            // コメント入れれば＞＞勝利スコアになればゲームオーバーになる
                            if (this.score > this.winningScore) this.gameOver = true;
                        }
                    }
                })
            });
            // filterはレーザの攻撃で、敵がどうなったかフィルター、敵インターバル
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if(this.enemyTimer > this.enemyInterval && !this.gameOver){
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }
        // 描く順番に注意！上書き：背景＞プレイヤー＝UI＝敵＞レイヤー4
        draw(context){
            // ①レイヤー設定したバックグラウンドを描く
            //this.background.draw(context);
            // ②弾薬表示の呼び出し
            this.player.draw(context);
            // ③プレイヤーの呼び出し
            this.ui.draw(context);
            // drawメソッド内でparticle.draw(context)で歯車の配列を渡す
            //this.particles.forEach(particle => particle.draw(context));
            // 敵クラスの呼び出し
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
            // 爆風クラスの呼び出し
            //this.explosions.forEach(explosion => {
            //    explosion.draw(context);
            }

            // 最前列にレイヤー4を呼び出す
            //this.background.layer4.draw(context);

        // 親super敵クラスの子クラスを呼ぶnew
        addEnemy(){
            const randomize = Math.random();
            // 0.3のAngler1を出現させて
            if(randomize < 0.3) this.enemies.push(new Angler1(this));
            // 0.6はAngler2になる
            else if (randomize < 0.6)this.enemies.push(new Angler2(this));
            // 0.8はHivewhaleになる
            else if (randomize < 0.7)this.enemies.push(new Hivewhale(this));
            else this.enemies.push(new LuckyFish(this));
            // console.log(this.enemies);
        }
        /* 爆風と火の呼び出し＞ランダム
        addExplosion(enemy){
            const randomize = Math.random();
            if(randomize < 0.5) {
                this.explosions.push(new SmokeExplosion
                    (this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            } else {
                this.explosions.push(new FireExplosion
                    (this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            }
            //console.log(this.explosions);
        }
        */
        // 当たり判定、長方形(プレイヤー)の大きさに含まれるかどうか
        checkCollsion(recr1, rect2){
            return(     recr1.x < rect2.x + rect2.width &&
                        recr1.x + recr1.width > rect2.x &&
                        recr1.y < rect2.y + rect2.height &&
                        recr1.height + recr1.y > rect2.y     )
        }
    }
    // すべてのクラスが実行されるmainになる
    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;// 前回の弾薬補充カウント数

    // アニメーションループ
    function animate(timeStamp) {
        // 弾薬が前回から今回を差し引く
        const deltaTime = timeStamp - lastTime;
        // console.log(deltaTime);
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);// アニメーションがクリアされる
        game.draw(ctx);
        game.update(deltaTime);// game.update()に引数deltaTimeを入れる
        //game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate(0);// animate(0)引数に「0」を入れる
});
