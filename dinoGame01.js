let canvas01 = document.getElementById('canvas01');
const ctx = canvas01.getContext('2d');

const dinoImage = new Image(); // img 要素を作成
dinoImage.src = `image/dino.png`; // 画像のパスを指定
dinoImage.onload = () => {
    ctx.drawImage(dinoImage, 0, 500); // 画像の描画
}