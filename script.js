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
                        (e.key === 'ArrowDown')
                ) && this.game.keys.indexOf(e.key) === -1){
                    this.game.keys.push(e.key);
                // 入力操作にスペースを追加して攻撃
                } else if ( e.key === ' '){
                    this.game.player.shootTop();
                } else if ( e.key === 'd'){
                    this.game.debug = !this.game.debug;
                }
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
        // 3つの引数が必要
        constructor(game, x, y){
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 3;
            this.markedForDeletion = false;
            //this.image = document.getElementById('projectile');
        }
        update(){
            this.x += this.speed;
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
        }
        draw(context){
            //context.drawImage(this.image, this.x, this.y);
            //下記はcanvasで描いたもの
            context.fillStyle = 'yellow';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    /*
    // 敵に衝突した歯車残骸
    class Particle {
        constructor(game, x, y){
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('gears');
            this.frameX = Math.floor(Math.random() * 3);// 歯車のX座標
            this.frameY = Math.floor(Math.random() * 3);// 歯車のY座標
            this.spriteSize = 50;// 歯車のサイズは50
            this.sizeModifiler = (Math.random() * 0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifiler;
            this.speedX = Math.random() * 6 - 3;// 敵を破壊したときに歯車がx軸に「6」か「3-」で出現
            this.speedY = Math.random() * -15;// 歯車がY軸方向へ「-15」速さで落ちる
            this.gravity = 0.5;// 重力
            this.markedForDeletion = false;// 初期値は発射物レーターは偽
            this.angle = 0;// 歯車の角度のアングル
            this.va = Math.random() * 0.2 - 0.1;// 歯車の角度の乱数
            //this.bounced = false;// バウンドさせない
            this.bounced = 0;// バウンドが「0」回の初期値
            this.bottomBouncedBoundary = Math.random() * 80 + 60;// 歯車がバウンド上下の高さ
        }
        update(){
            this.angle += this.va;// vaによる回転角度
            this.speedY += this.gravity;// 速度Yは重力によって増加

            // ここまで重力の影響を受ける
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;

            // 発射物に当たると歯車はスクロールしている
            if(this.y > this.game.height + this.size ||
                this.x < 0 - this.size) this.markedForDeletion = true;

            // バウンド条件
            // if (this.y > this.game.height - this.bottomBouncedBoundary && !this.bounced){
                if (this.y > this.game.height - this.bottomBouncedBoundary && this.bounced < 2){
                //this.bounced = true;
                this.bounced++;
                this.speedY *= -0.7;
            }
        }
        // 粒子画像はグリッドであるためフレームに必要なスプライトシート
        // 各、粒子で切り取る考え方
        // 歯車残骸が回転する
        draw(context){
            context.save();// セーブする
            context.translate(this.x, this.y);// 歯車の回転の初期値
            context.rotate(this.angle);// 歯車でangle加算加算
            context.drawImage(this.image,
                                this.frameX * this.spriteSize,
                                this.frameY * this.spriteSize,
                                this.spriteSize, this.spriteSize,
                                //this.x,
                                //this.y,// 歯車の初期値から回転してしまう
                                //0, これだと歯車から回転してしまう
                                //0,
                                this.size * -0.5,// 回転する高さの半分の歯車が中心
                                this.size * -0.5,
                                this.size, this.size);
            context.restore();// セーブする
        }
    }
    */

    // プレイヤー
    class Player {
        constructor(game){
            this.game = game;
            // プレイヤーの大きさ
            this.width = 120;
            this.height = 190;
            // プレイヤー位置
            this.x = 20;
            this.y = 100;

            this.frameX = 0; // スプライトシートを循環する水平方向X[0]が行を決定
            this.frameY = 0; // スプライトシートを循環する水平方向Y[0]が列を決定
            //this.maxFrame = 37; // スプライトシートのフレーム37

            // プレイヤー垂直速度初期値
            this.speedY = 0;
            // フィールドに置いた値をY速度に「this.maxSpeed」持っていくテクニック
            this.maxSpeed = 3;
            // 発射物の配列
            this.projectiles = [];

            // パワーアップの定義
            this.powerUp = false; // 最初からパワーアップしない
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;

            //this.image = document.getElementById('player');
        }
        // プレイヤーの垂直方向のY速度
        update(deltaTime){
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;

            // プレイヤーが画面上下端までいけるようにする
            if(this.y > this.game.height - this.height * 0.5)
            this.y = this.game.height - this.height *0.5;
            else if (this.y < -this.height *0.5)
            this.y = -this.height * 0.5;

            // 発射物の配列を取り出す＞呼び出す
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            // filter()で通過するすべての要素に新しい配列を提供する
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            // スプライトをアニメーションフレームにする
            // maxFrame37まで＋＋して、それ以外は「0」に戻す→forで繰り返してない
            if(this.frameX < this.maxFrame){
                this.frameX++;
            } else {
                this.frameX = 0;
            }
            // プレイヤーのpowerアップ
            if(this.powerUp){
                if(this.powerUpTimer > this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.1;
                }
            }
        }
        // context引数を外からもってくるやりかた＝ctx同じ
        draw(context){
            context.fillStyle = 'black';//プレイヤーの色→strokeRectでいらない
            context.fillRect(this.x, this.y, this.width, this.height);//塗りつぶし

            //デバッグモードの枠線
            if(this.game.debug)
            context.strokeRect(this.x, this.y, this.width, this.height); // 枠線だけ
            // 発射物の配列を取り出す＞呼び出す
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });

            // プレイヤー画像を持ってくる
            //context.drawImage(this.image, this.x, this.y);// 1枚シート全体
            //context.drawImage(this.image, this.x, this.y, this.width, this.height); //1枚シートを120×190の大きさでを座標20．100から表示
            //context.drawImage(this.image, sx, sy, sw, sh, this.x, this.y, this.width, this.height); sx,sy,sw,shの紹介
            //context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height,
                //this.width, this.height, this.x, this.y, this.width, this.height);
            // 発射物の配列を取り出す＞呼び出す
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }
        // 準備した発射物を攻撃できる
        shootTop(){
            // 弾薬を無制限で打てないようにする
            if (this.game.ammo > 0){
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30 ));
                //console.log(this.projectiles);
                this.game.ammo--;
            }
            //console.log(this.projectiles);
            if (this.powerUp) this.shootBottom();
        }
        // パワーアップして、下からも打てる
        shootBottom(){
            if (this.game.ammo > 0){
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175 ));
            }
            //console.log(this.projectiles);
        }
        // プレイヤーのpowerアップ
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
            this.speedX = Math.random() * -1.5 -0.5;
            this.markedForDeletion = false;// レーザに当たるとfalse
            //this.lives = 5;// 敵のライフが5
            //this.score = this.lives;// 敵ライフ5と点数5が等しい関係

            // 敵キャラクター座標とフレーム初期値
            this.frameX = 0;
            this.frameY = 0;
            //this.maxFrame = 37;
        }
        update(){// 敵の水平X軸を調整する
            //this.x += this.speedX;
            this.x += this.speedX - this.game.speed;
            if(this.x + this.width < 0) this.markedForDeletion = true;

            /*
            敵のアニメーション
            if(this.frameX < this.maxFrame){
                this.frameX++;
            } else this.frameX = 0;
            */
        }
        draw(context){
            //プレイヤーの塗りつぶしと同じ考え
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width * 0.3, this.height * 0.3);

            if(this.game.debug)//プレイヤーと同じくデバッグモードを敵に追加
            // 敵キャラクターが四角枠だけになる
            context.strokeRect(this.x, this.y, this.width, this.height);
            // 敵キャラクターを大きなスプライトシートで1枚で読み込む
            //context.drawImage(this.image, this.x, this.y);
            // 1枚シートを228×169の大きさでを全体を表示
            //context.drawImage(this.image, this.x, this.y, this.width, this.height);
            // sx,sy,sw,shの紹介
            //context.drawImage(this.image, sx, sy, sw, sh, this.x, this.y, this.width, this.height);
            //context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height,
                //this.width, this.height, this.x, this.y, this.width, this.height);
            //context.drawImage(this.image, this.x, this.y);
            //敵ライフを視覚的に見えるようにする
            //context.fillStyle = 'black'; デフォルトで黒らしい
            if(this.game.debug){
            context.font = '20px Helvatica';
            context.fillText(this.lives, this.x, this.y);
            }
        }
    }
    // 継承関係の敵キャラクター(Angler1)オーバライド
    // 同メソッド再宣言して、継承されている場所を自動探し、コードの繰り返しを減らす
    class Angler1 extends Enemy {
        constructor(game){
            super(game);
            this.width = 228 * 0.5; //大きさは調整したときの残り
            this.height = 169 * 0.5;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            //this.image = document.getElementById('angler1');
            this.frameY = Math.floor(Math.random() * 3);
            this.lives = 2;
            this.score = this.lives;
        }
    }
    // 継承関係の敵キャラクター(Angler2)オーバライド
    // 親クラスで書いているので楽なる
    class Angler2 extends Enemy {
        constructor(game){
            super(game);
            this.width = 213 * 0.5;
            this.height = 165 * 0.5;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            //this.image = document.getElementById('angler2');
            this.frameY = Math.floor(Math.random() * 2);
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
            this.score = 3;
            this.type = 'lucky';
        }
    }
    // 継承関係で大型タイプのhivewhaleをオーバライド
    class Hivewhale extends Enemy {
        constructor(game){
            super(game);
            this.width = 400 * 0.5;
            this.height = 227 * 0.5;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            //this.image = document.getElementById('hivewhale');
            this.frameY = 0;
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
    // レイヤーオブジェクトの設定するクラス
    class Layer {
        constructor(game, image, speedModifier){
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;// 背景画像大きさ
            this.height = 500;
            this.x = 0;// 背景画像の開始座標
            this.y = 0;
        }
        update(){
            // 更新＞画像の動き方＞画像が左から右へ
            if(this.x <= -this.width)
            // 再びスクロールできるように「0」
            this.x = 0;
            // それ以外は、Xをゲーム速度倍に減らす視差
            //else this.x -= this.game.speed * this.speedModifier;
            this.x -= this.game.speed * this.speedModifier;// 画面端っこをスムーズにする
        }
        // レイヤーを描く
        draw(context){
            //context.drawImage(this.image, this.x, this.y);
            //2番目に同一の画像を書くことでシームレスになる
            //context.drawImage(this.image, this.x + this.width, this.y);
        }
    }

    // 各レイヤー背景クラスを処理するクラス
    class Background {
        constructor(game){
            this.game = game;
            // javascriptでのhtmlを呼び出すID＝layer1
            //this.image1 = document.getElementById('layer1');
            //this.image2 = document.getElementById('layer2');
            //this.image3 = document.getElementById('layer3');
            //this.image4 = document.getElementById('layer4');
            //this.layer1 = new Layer(this.game, this.image1, 0.2);
            //this.layer2 = new Layer(this.game, this.image2, 0.4);
            //this.layer3 = new Layer(this.game, this.image3, 1);
            //this.layer4 = new Layer(this.game, this.image4, 1.5);
            //this.layers = [this.layer1, this.layer2, this.layer3, this.layer4];
            // レイヤー4を同一に表示させない
            //this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update(){
            //this.layers.forEach(layer => layer.update());
        }
        draw(context){
            //this.layers.forEach(layer => layer.draw(context));
        }
    }

    /*
    // 親の爆発クラス
    class Explosion {
        constructor(game, x, y){
            this.game = game;
            //this.x = x;
            //this.y = y;
            this.frameX = 0;
            this.spriteWidth = 200;
            this.spriteHight = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 30;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime){
            this.x -= this.game.speed // 爆風のスクロール
            if(this.timer > this.interval){
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            // 爆風配列に、爆風がたまり続けるため
            if(this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context){
            context.drawImage(this.image, this.frameX * this.spriteWidth, 0,
                 this.spriteWidth, this.spriteHight, this.x, this.y, this.width, this.height);
        }
    }

    // 子の「煙」の爆発クラス
    class SmokeExplosion extends Explosion{
        constructor(game, x, y){
            super(game, x, y);
            this.image = document.getElementById('smokeExplosion');
            //this.spriteWidth = 200;
            //this.width = this.spriteWidth;
            //this.height = this.spriteHight;
            //this.x = x - this.width * 0.5;
            //this.y = y - this.height * 0.5;
        }
    }

    // 子の「火」の爆発クラス
    class FireExplosion extends Explosion{
        constructor(game, x, y){
            super(game, x, y);
            this.image = document.getElementById('fireExplosion');
            //this.spriteWidth = 200;
            //this.width = this.spriteWidth;
            //this.height = this.spriteHight;
            //this.x = x - this.width * 0.5;
            //this.y = y - this.height * 0.5;
        }

    }
    */

    // 弾薬数タイマーやカウントダウンを表示
    class UI {
        constructor(game){
            // フィールド情報
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.color = 'white';
        }
        // 弾薬・スコア点数を描く
        draw(context){
            context.save();// スコープ内のcontextだけ影を開始＞＞敵ライフ「5」に影なし
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;//影をつけている
            context.shadowOffsetY = 2;//影をつけている
            context.shadowColor = 'black';

            // スコア点数表示
            // this.fontSize + 'px_' スペースがないと変数を読み込まない
            context.font = this.fontSize + 'px ' + this.fontFamily;
            context.fillText('Score: ' + this.game.score, 20, 40);
            context.fillText('弾数: ', 140, 40);


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
            context.fillText('Timer: ' + formattedTime, 20, 90);// タイマーを表示させる座標

            // ゲームが終わった時のメッセージ
            if (this.game.gameOver){
                context.textAlin = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore){
                    message1 = 'You win!';
                    message2 = '点数：' + this.game.score + 'です！';
                } else {
                    message1 = 'You lose!';
                    message2 = '点数：' + this.game.score + 'です！';
                }
                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
            }
            // レーザ発射物の残数がパワーアップ時の色が変更される
            // context.fillStyle = this.color;
            if(this.game.player.powerUp) context.fillStyle = 'red';// パワーアップ時の表示の色
            for (let i = 0; i < this.game.ammo; i++){
                // (20, 50)開始位置です。幅は 3 で高さは 20 です。
                // (20 + 5 * i), (50), (3), (20)→カンマ区切り
                context.fillRect( 20 + 5 * i, 50, 3, 20);
                context.fillText(i , 180, 40);//→残数の表示がおかしい
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
            this.background = new Background(this);

            this.player = new Player(this);
            this.input = new InputHandler(this)

            this.ui = new UI(this);//UIの弾薬表示をオブジェクト化
            this.keys = [];//キーボード操作を配列に格納

            //敵の出現は同じもの使用する「弾薬の間隔」があるので
            this.enemies = [];// 敵クラスの配列を宣言
            //this.particles = [];// 敵を倒した残骸歯車
            //this.explosions = [];// 敵を倒した爆発

            this.enemyTimer = 0;// 敵の初期時間は0
            this.enemyInterval = 1500;// 敵の出現頻度

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

            this.speed = 1; // 背景バックグラウンド速度
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

            // 歯車の配列を呼び出す
            //this.particles.forEach(particle => particle.update());
            // filterメソッドで歯車の配列を置き換える
            //this.particles = this.particles.filter(particle => !particle.markedForDeletion);

            // 爆風の配列を呼び出す
            //this.explosions.forEach(explosion=> explosion.update(deltaTime));
            // filterメソッドで爆風の配列を置き換える
            //this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);


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
            this.ui.draw(context);
            // ③プレイヤーの呼び出し
            this.player.draw(context);
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
