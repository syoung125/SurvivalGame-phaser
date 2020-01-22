let cursors;
let player;
let showDebug = false;
var game;
var worldLayer;
var speed = 175;
var preSpeed;
var score = 0;

var enemies;  
var total  = 1; //TOTAL ENEMIES
var hardEnemies = [];
var skeletons = [];
var enemySpeed = 1;
var enemyHardSpeed = 2;

//GHOST AND CAT DIRECTIONS
var moveRight;
var moveLeft;
var moveUp;
var moveDown;

//TIME VARIABLES
var enemyTimer = 0;
var ghostDelay = 5000;
var ghostHardDelay = 8000;
var hungerTimer = 0;
var hungerDelay = 1000;
var manaTimer = 0;
var manaDelay = 500;
var potionTintTimer;
var itemTimer = [];

//CAT VARIABLES
var cat = null;
var catNum = 0;
var catSpeed = 2;
var healingShow = null;


let foods;
var foodRec;
let potions;
var potionsRec = [];
var enterRec;
var fire;

var mana = true;


window.onload = function() {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 }
      }
    },
    scene: {
    preload: preload,
    create: create,
    update: update
    }
  };
  game = new Phaser.Game(config);
};

function preload() {
  this.load.image("tiles", "../assets/tilesets/room-tileset.png");
  this.load.tilemapTiledJSON("homeMap", "../assets/tilemaps/home-map.json");
  this.load.tilemapTiledJSON("dungeonMap", "../assets/tilemaps/dungeon-map.json");
  this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");

  //LOAD ENEMY SPRITESHEETS
  this.load.spritesheet("ghost", "../assets/sprites/ghost.png", { frameWidth: 32, frameHeight: 32, endFrame: 12 });
  this.load.spritesheet("ghostHard", "../assets/sprites/ghostHard.png", { frameWidth: 32, frameHeight: 32, endFrame: 12 });
  this.load.spritesheet("skeleton", "../assets/sprites/skeleton.png", { frameWidth: 32, frameHeight: 32, endFrame: 12 } );

  //LOAD CHEST SPRITESHEET
  this.load.spritesheet("chest", "../assets/sprites/chest.png", {frameWidth: 32, frameHeight: 32, endFrame: 6});
  //LOAD CAT SPRITESHEET
  this.load.spritesheet("cat", "../assets/sprites/cat1.png", { frameWidth: 32, frameHeight: 32, endFrame: 12 });
  //LOAD HEALING UP SPRITE
  this.load.spritesheet("healing", "../assets/sprites/healing.png", { frameWidth: 16, frameHeight: 16, endFrame: 1 });


  // LOAD FOOD SPRITESHEET
  this.load.spritesheet("food", "../assets/images/food.png",{ frameWidth: 16, frameHeight: 16, endFrame: 18 });
  // LOAD POTION SPRITESHEET
  this.load.spritesheet("potion", "../assets/images/potion.png",{ frameWidth: 16, frameHeight: 16, endFrame: 9 });
  // LOAD EXPLOSION SPRITESHEET
  this.load.spritesheet("explosion", "../assets/sprites/explosion.png", { frameWidth: 64, frameHeight: 64, endFrame: 23 });

}

var map; 
var currentMap;
var camera;
var spawnPoint;
var colPW;  //collider between player and worldLayer

function setMap(scene, mapName){
  currentMap = mapName;
  // currentMap = "dungeonMap";
  map = scene.make.tilemap({ key: currentMap });
  const tileset = map.addTilesetImage("room-tileset", "tiles");

  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });
  aboveLayer.setDepth(10);
  spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  const enterArea = map.findObject("Objects", obj => obj.name === "Enter Area");
  enterRec = new Phaser.GameObjects.Rectangle(scene, enterArea.x, enterArea.y, enterArea.width, enterArea.height);

  // Create a sprite with physics enabled via the physics system. The image used for the sprite has
  // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
  // if(player)
  if(player == undefined){
    player = scene.physics.add
    .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
    .setSize(30, 40)
    .setOffset(0, 24).setDepth(5);
  }else{
    scene.physics.world.removeCollider(colPW);
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
  }
  
  colPW = scene.physics.add.collider(player, worldLayer);

  camera = scene.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function initPlayer(){
  player.health = 100;
  player.hunger = 0;
  player.mana = 0;
}

function create() {

  setMap(this, "homeMap");
  initPlayer();
  
  if(currentMap == "homeMap"){
    initHomeGameObjects(this);
  }else if(currentMap == "dungeonMap"){

  }


  cursors = this.input.keyboard.createCursorKeys();

  // Debug graphics
  this.input.keyboard.once("keydown_D", event => {
    // Turn on physics debugging to show player's hitbox
    this.physics.world.createDebugGraphic();

    // Create worldLayer collision graphic above the player, but below the help text
    const graphics = this.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(20);
    worldLayer.renderDebug(graphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 40, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });
  });


  var scene = this;
  this.input.keyboard.on("keydown_E", function(event){
    if(player.x >= enterRec.x && player.x <= enterRec.x + enterRec.width 
      && player.y >= enterRec.y && player.y <= enterRec.y + enterRec.height){
      if(currentMap == "homeMap"){
        setMap(scene, "dungeonMap");
      }else if(currentMap == "dungeonMap"){
        setMap(scene, "homeMap");
      }
    }
  });
  

  const anims = this.anims;
  addAnimations(anims);
  fire = this.physics.add.sprite(player.x, player.y, 'explosion').play('explodeAnimation');

  setMana();
}


function update(time, delta) {
  if(cat != null){
    followPlayer(cat,catSpeed);
    
    if(moveRight){
      cat.anims.play('catRight', true);
    }else if(moveLeft){
      cat.anims.play('catLeft', true);
    }else if(moveUp){
      cat.anims.play('catBack', true);
    }else if(moveDown){
      cat.anims.play('catFront', true);
    }else{
      cat.anims.play("catStay",true);
    }    

    if(distanceBetween(cat, player) < 50){
      healingShow.setVisible(true);
      if(player.health <= 100)
        addPlayerHealth(0.1);
    }else {
      healingShow.setVisible(false);
    }

  }
  //CREATE ENEMY WITH DELAY
  if (total < 15 && this.time.now > enemyTimer) {
      var enemy = enemies.create(Phaser.Math.FloatBetween(50, 400),Phaser.Math.FloatBetween(300, 650),"ghost");
      enemy.type = 1;
      enemyTimer = this.time.now + ghostDelay;
      total++;
  }else if(total < 25 && this.time.now > enemyTimer) {
      var enemy = enemies.create(Phaser.Math.FloatBetween(50, 400),Phaser.Math.FloatBetween(300, 650),"ghostHard");
      enemy.type = 2;
      hardEnemies.push(enemy);
      enemyTimer = this.time.now + ghostHardDelay;
      total++;
  }
  //ENEMY MOVEMENT
  enemies.children.iterate(function (child) {
    if(child != undefined){ 
      if(mana && child.type != 3){ //can't kill skeleton
        if(distanceBetween(child, player) < 50){
          killEnemy(child);
        }
      }
      //IF THE DISTANCE BETWEEN ENEMY AND PLAYER IS LESS THAN 150
      if(distanceBetween(child, player) < 150){
        if (child.type == 1) { //GHOST EASY ENEMY
          followPlayer(child, enemySpeed);

          if(moveRight){
            child.anims.play('ghostRight', true);
          }else if(moveLeft){
            child.anims.play('ghostLeft', true);
          }else if(moveUp){
            child.anims.play('ghostBack', true);
          }else{
            child.anims.play('ghostFront', true);
          }
        }else if(child.type == 2){ //GHOST HARD ENEMY
          followPlayer(child, enemyHardSpeed);

          if(moveRight){
            child.anims.play('ghostHardRight', true);
          }else if(moveLeft){
            child.anims.play('ghostHardLeft', true);
          }else if(moveUp){
            child.anims.play('ghostHardBack', true);
          }else{
            child.anims.play('ghostHardFront', true);
          }
        }else if(child.type == 3){
          const speedSkeleton = 100;

          // Stop any previous movement from the last frame
          child.body.setVelocity(0);

          followPlayer(child, speedSkeleton);
          child.body.velocity.normalize().scale(speedSkeleton);

          if(child.direction.right){
            child.anims.play('skeletonRight', true);
          }else if(child.direction.left){
            child.anims.play('skeletonLeft', true);
          }else if(child.direction.up){
            child.anims.play('skeletonBack', true);
          }else{
            child.anims.play('skeletonFront', true);
          }
        }
      }else{
        if(child.type == 1){
          child.anims.play('ghostFront', true);
        }
        else if(child.type == 2){
          child.anims.play('ghostHardFront', true);
        }
        else if(child.type == 3){
          child.anims.play("skeletonStay",true);
          child.body.setVelocity(0);
        }
      }
    }
  });

  // STOP ITEM TIMER IF IT SET
  manageItemTimer(time, delta);

  //PLAYER
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();

    // If we were moving, pick and idle frame to use
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
    else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
    else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
    else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }

  //PLAYER STATUS
  showPlayerInfo(this);
  //IF() STOP GAME
  if(player.health <= 0){
    player.setTint(0xff0000);
    this.scene.pause();
  }
  if(player.hunger >= 100){
    player.setTint(0xff0000);
    this.scene.pause();
  }
  //INCREASE HUNGER EVERY SECOND
  if(this.time.now > hungerTimer){
    addPlayerHunger(1);
    hungerTimer = this.time.now + hungerDelay;
  }
  //INCREASE MANA EVERY 2 SECOND
  if(this.time.now > manaTimer){
    if(!mana)
      addPlayerMana(1);
    else
      addPlayerMana(-5);
    manaTimer = this.time.now + manaDelay;
  }
   // When the mana gauge is full, set fire
   setMana();

  //UPDATE SCORE
  score += 0.01;
  updateScore(this, score);
}

function updateScore(scene, score){
  var scoreStr = "Score: " + Math.floor(score);
  scene.add
    .text(16, 16, scoreStr, {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0)
    .setDepth(30);
}

function chestCatOpen(chestCat){
  if(catNum != 1){
    chestCat = this.physics.add.sprite(20,270,"chest","3");
    cat = this.physics.add.sprite(20,270,"cat","1");
    catNum++;

    score += 100;
  }
}

function enemyCatched(){
  addPlayerHealth(-1);
}

function hardEnemyCatched(){
  addPlayerHunger(1);
  addPlayerHealth(-1);
}

function showPlayerInfo(scene){
  var healthStr = 'player health: '+ Math.floor(player.health)+ '%';
  var hungerStr = 'player hunger: '+player.hunger+ '%';
  var manaStr = 'player mana: '+ Math.floor(player.mana)+ '%';

  scene.add
    .text(550, 16, healthStr + '\n' + hungerStr + '\n' + manaStr, {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0)
    .setDepth(10);
}

function addPlayerHealth(health){
  player.health += health;
}

function addPlayerHunger(hunger){
  player.hunger += hunger;
}

function addPlayerMana(mana){
  player.mana += mana;
}

function createFood(scene){
  var r_x = 600, r_y = 10;
  while(1){
    // r_x = Phaser.Math.FloatBetween(600, 770);
    // r_y = Phaser.Math.FloatBetween(10, 900);
    r_x = Phaser.Math.FloatBetween(foodRec.x, foodRec.x+foodRec.width);
    r_y = Phaser.Math.FloatBetween(foodRec.y, foodRec.y+foodRec.height);
    if((r_x >= 640 && r_x<=700 && r_y >= 90 && r_y <= 160)
      ||(r_x >= 700 && r_x<=760 && r_y >= 790 && r_y <= 860)){
      continue;
    }else{ break; }
  }
  
  var r_img = Math.floor(Phaser.Math.FloatBetween(0, 17));

  var food = scene.physics.add.image(r_x, r_y,'food', r_img)
  .setScale(2)
  .setDepth(10);


  return food;
}


function eatFood(player, food){
  // console.log('eatFood');
  food.disableBody(true, true);
  addPlayerHunger(-10);
  score += Phaser.Math.FloatBetween(5,20);
  foods.push(createFood(this));

  if(player.hunger <= 0)
    player.hunger = 0;
}



function createPotion(scene){
  var r_point = potionRanPos();
  var r_img = Math.floor(Phaser.Math.FloatBetween(0, 8));
  var potion = scene.physics.add.image(r_point[0], r_point[1],'potion', r_img)
  .setScale(2)
  .setDepth(10);

  return potion;
}

// Generate random potion point in specific area
function potionRanPos(){
  var r_rect = Math.floor(Phaser.Math.FloatBetween(0, 2.9)); 
  var r_x = Phaser.Math.FloatBetween(potionsRec[r_rect].x, potionsRec[r_rect].x + potionsRec[r_rect].width);
  var r_y = Phaser.Math.FloatBetween(potionsRec[r_rect].y, potionsRec[r_rect].y + potionsRec[r_rect].height);
  return [r_x, r_y];
}


function eatPotion(player, potion){
  // 0 yellow, 1 orange, 2 blue, 3 pink, 4 purple, 5 green, 6 skyblue, 7 yellow, 8 orange
  var color = ["0xffdd41", "0xdd3b23", "0x285ac2", "0xc24b9f", "0xB9202A", "0x20C1D0", "0x23A0DE", "0xffdd41", "0xdd3b23"];
  var item = [speedUp, invisible, manaIncrease];
  player.setTint(color[potion.frame.name]);

  // Become original color after 2 mins
  potionTintTimer = this.time.delayedCall(2000, releaseTint, [], this);

  // Generate random item
  var r_item = Math.floor(Phaser.Math.FloatBetween(0, item.length));
  item[r_item](this);

  potion.disableBody(true, true);
  score += Phaser.Math.FloatBetween(5,10);
}

function releaseTint(){
  player.setTint(0xffffff);
  if(itemTimer['invisible'] != undefined){
    player.setTint(0x000000); // when is invisibe it should be black
  }
}


function manageItemTimer(time, delta){
  if(itemTimer['speedUp'] != undefined){
    itemTimer['speedUp'] -= delta;
    if(itemTimer['speedUp'] <= 0){
      itemTimer['speedUp'] = undefined;
      speedNormal();
    }
  }
  if(itemTimer['invisible'] != undefined){
    itemTimer['invisible'] -= delta;
    if(itemTimer['invisible'] <= 0){
      itemTimer['invisible'] = undefined;
      releaseTint();
    }
  }
}


// ITEM 1: SPEED UP 
function speedUp(){
  if(itemTimer['speedUp'] != undefined)
    return;

  console.log('speedUp');
  preSpeed = speed;
  speed += 50;
  itemTimer['speedUp'] = 3000;
}

function speedNormal(){
  speed = preSpeed;
}

// ITEM 2: INVISIBLE - YOU CAN'T BE CATCH BY GHOST 
function invisible(){
  if(itemTimer['invisible'] != undefined)
    return;

  console.log('invisible');
  player.setTint(0x000000);
  itemTimer['invisible'] = 5000;
}

// ITEM 3: Increase mana big amount
function manaIncrease(){
  console.log('manaIncrease');
  addPlayerMana(15);
}


// MANAGE MANA FUNCTION
function setMana(){
  if(player.mana <= 0){
    player.mana = 0;
    mana = false;
  } 
  if(player.mana >= 100){
    player.mana = 100;
    mana = true;
  } 

  if(mana){
    fire.x = player.x;
    fire.y = player.y;
    fire.setVisible(true);
  }else{
    fire.setVisible(false);
  }
}

function killEnemy(child){
  child.setVisible(false);
  child.setScale(0);
  enemies.remove(child);

  if(child.type == 1)
    score += Phaser.Math.FloatBetween(30,50);
  else if(child.type == 2)
    score += Phaser.Math.FloatBetween(60,100);
}


function distanceBetween(follower, player){
  return Math.sqrt((player.x - follower.x) * (player.x - follower.x) + (player.y - follower.y) * (player.y - follower.y));
}
function followPlayer(follower, speed){
  // if invisible item set, ghost can't find the player.
  if(itemTimer['invisible'] != undefined){
    return;
  }

  //IF ENEMY IS IN THE LEFT SIDE OF THE PLAYER
  if(follower.x < player.x - 10){
    moveRight = true;
    moveLeft = false;
    if(follower.type == 3){
      follower.direction.right = true;
      follower.direction.left = false;
      follower.body.setVelocityX(speed);
    }else{
      follower.x += speed;
    }
  }
  //IF ENEMY IS IN THE RIGHT SIDE OF THE PLAYER
  else if(follower.x > player.x + 10){
    moveRight = false;
    moveLeft = true;
    if(follower.type == 3){
      follower.direction.right = false;
      follower.direction.left = true;
      follower.body.setVelocityX(-speed);
    }else{
      follower.x -= speed;
    }
  }else{ //when they are in the same line
    moveLeft = false;
    moveRight = false;
    if(follower.type == 3){
      follower.direction.left = false;
      follower.direction.right = false;
    }
  }

  //IF ENEMY IS IN THE UP SIDE OF THE PLAYER
  if(follower.y < player.y - 10){
    moveUp = false;
    moveDown = true
    if(follower.type == 3){
      follower.direction.up = false;
      follower.direction.down = true;
      follower.body.setVelocityY(speed);
    }else{
      follower.y += speed;
    }
  //IF ENEMY IS IN THE DOWN SIDE OF THE PLAYER
  }else if(follower.y > player.y + 10){
    moveUp = true;
    moveDown = false;
    if(follower.type == 3){
      follower.direction.up = true;
      follower.direction.down = false;
      follower.body.setVelocityY(-speed);
    }else{
      follower.y -= speed;
    }
  }else{
    moveUp = false;
    moveDown = false;
    if(follower.type == 3){
      follower.direction.up = false;
      follower.direction.down = false;
    }
  }
}

function addAnimations(anims){
  //CAT ANIMATION
  anims.create({
    key: 'catStay',
    frames: anims.generateFrameNumbers('cat', { start: 1, end: 1}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: 'catFront',
    frames: anims.generateFrameNumbers('cat', { start: 0, end: 2}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: "catLeft",
    frames: anims.generateFrameNumbers('cat', { start: 3, end: 5}),
    frameRate: 6,
    repeat: -1
  });
   anims.create({
    key: "catRight",
    frames: anims.generateFrameNumbers('cat', { start: 6, end: 8}),
    frameRate: 6,
    repeat: -1
  });
    anims.create({
    key: "catBack",
    frames: anims.generateFrameNumbers('cat', { start: 9, end: 11}),
    frameRate: 6,
    repeat: -1
  });

  //GHOST ANIMATION 
  anims.create({
    key: 'ghostFront',
    frames: anims.generateFrameNumbers('ghost', { start: 0, end: 2}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: "ghostLeft",
    frames: anims.generateFrameNumbers('ghost', { start: 3, end: 5}),
    frameRate: 6,
    repeat: -1
  });
   anims.create({
    key: "ghostRight",
    frames: anims.generateFrameNumbers('ghost', { start: 6, end: 8}),
    frameRate: 6,
    repeat: -1
  });
    anims.create({
    key: "ghostBack",
    frames: anims.generateFrameNumbers('ghost', { start: 9, end: 11}),
    frameRate: 6,
    repeat: -1
  });

  //GHOST HARD MODE ANIMATION
  anims.create({
    key: 'ghostHardFront',
    frames: anims.generateFrameNumbers('ghostHard', { start: 0, end: 2}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: "ghostHardLeft",
    frames: anims.generateFrameNumbers('ghostHard', { start: 3, end: 5}),
    frameRate: 6,
    repeat: -1
  });
   anims.create({
    key: "ghostHardRight",
    frames: anims.generateFrameNumbers('ghostHard', { start: 6, end: 8}),
    frameRate: 6,
    repeat: -1
  });
    anims.create({
    key: "ghostHardBack",
    frames: anims.generateFrameNumbers('ghostHard', { start: 9, end: 11}),
    frameRate: 6,
    repeat: -1
  });

  //SKELETON ANIMATION
  anims.create({
    key: 'skeletonStay',
    frames: anims.generateFrameNumbers('skeleton', { start: 1, end: 1}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: 'skeletonFront',
    frames: anims.generateFrameNumbers('skeleton', { start: 0, end: 2}),
    frameRate: 6,
    repeat: -1
  });
  anims.create({
    key: "skeletonLeft",
    frames: anims.generateFrameNumbers('skeleton', { start: 3, end: 5}),
    frameRate: 6,
    repeat: -1
  });
   anims.create({
    key: "skeletonRight",
    frames: anims.generateFrameNumbers('skeleton', { start: 6, end: 8}),
    frameRate: 6,
    repeat: -1
  });
    anims.create({
    key: "skeletonBack",
    frames: anims.generateFrameNumbers('skeleton', { start: 9, end: 11}),
    frameRate: 6,
    repeat: -1
  });

  //Explode ANIMATION 
  anims.create({
        key: 'explodeAnimation',
        frames: anims.generateFrameNumbers('explosion', {
          start: 0, end: 23, first: 23 
        }),
        frameRate: 20,
        repeat: -1
  });

  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
  anims.create({
    key: "misa-left-walk",
    frames: anims.generateFrameNames("atlas", {
      prefix: "misa-left-walk.",
      start: 0,
      end: 3,
      zeroPad: 3
    }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-right-walk",
    frames: anims.generateFrameNames("atlas", {
      prefix: "misa-right-walk.",
      start: 0,
      end: 3,
      zeroPad: 3
    }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-front-walk",
    frames: anims.generateFrameNames("atlas", {
      prefix: "misa-front-walk.",
      start: 0,
      end: 3,
      zeroPad: 3
    }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-back-walk",
    frames: anims.generateFrameNames("atlas", {
      prefix: "misa-back-walk.",
      start: 0,
      end: 3,
      zeroPad: 3
    }),
    frameRate: 10,
    repeat: -1
  });

}



function changeMap(mapName){
  currentMap = mapName;
}

function initHomeGameObjects(scene){
  const foodArea = map.findObject("Objects", obj => obj.name === "FoodArea");
  const potionArea1 = map.findObject("Objects", obj => obj.name === "PotionArea1");
  const potionArea2 = map.findObject("Objects", obj => obj.name === "PotionArea2");
  const potionArea3 = map.findObject("Objects", obj => obj.name === "PotionArea3");
  foodRec = new Phaser.GameObjects.Rectangle(scene, foodArea.x, foodArea.y, foodArea.width, foodArea.height);
  potionsRec.push(new Phaser.GameObjects.Rectangle(scene, potionArea1.x, potionArea1.y, potionArea1.width, potionArea1.height));
  potionsRec.push(new Phaser.GameObjects.Rectangle(scene, potionArea2.x, potionArea2.y, potionArea2.width, potionArea2.height));
  potionsRec.push(new Phaser.GameObjects.Rectangle(scene, potionArea3.x, potionArea3.y, potionArea3.width, potionArea3.height));


  var foodAmount = 10;
  foods = new Array();
  for(var i = 0; i < foodAmount ; i++){
    foods.push(createFood(scene));
  }

  scene.physics.add.overlap(player, foods, eatFood, null, scene);


  var potionAmount = 5;
  potions = new Array();
  for(var i = 0; i < potionAmount ; i++){
    potions.push(createPotion(scene));
  }

  scene.physics.add.overlap(player, potions, eatPotion, null, scene);

  //CREATE ENEMIES
  enemies = scene.physics.add.group();
  //ONE GHOST ENEMY HERE, OTHERS ARE CREATED IN UPDATE OVER TIME
  var enemy = enemies.create(Phaser.Math.FloatBetween(50, 400),Phaser.Math.FloatBetween(300, 700),"ghost");
  enemy.type = 1;
  enemyTimer = scene.time.now + ghostDelay;
  //SKELETON ENEMIES
  for (var i = 0; i < 5; i++) {
    var skeleton = scene.physics.add.sprite(Phaser.Math.FloatBetween(616, 790),Phaser.Math.FloatBetween(166, 790),"skeleton","1")
      .setScale(2).setSize(20,25).setOffset(6.5, 6).setDepth(5);
    skeleton.type = 3;
    skeleton.direction = {
      up : false,
      down : false,
      left : false,
      right : false
    }
    enemies.add(skeleton);
    skeletons.push(skeleton);
  }
  scene.physics.add.collider(skeletons, skeletons);
  //SKELETONS CAN COLLIDE WITH WORLD
  scene.physics.add.collider(skeletons, worldLayer);
  //WHEN ENEMY CATCHES PLAYER
  scene.physics.add.overlap(player, enemies, enemyCatched, null, scene);
  scene.physics.add.overlap(player, hardEnemies, hardEnemyCatched, null, scene);
 
  //CREATE THREASURE CHESTS
  var chestCat = scene.physics.add.sprite(20,270,"chest","0");
  scene.physics.add.overlap(player,chestCat,chestCatOpen,null,scene);
  //HEALING SYMBOL
  healingShow = scene.physics.add.sprite(765,33,"healing","0").setScrollFactor(0).setDepth(20).setVisible(false);


}