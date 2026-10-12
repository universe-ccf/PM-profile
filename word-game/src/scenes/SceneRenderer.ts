import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { Level, Question, SceneId } from '../types';

type Point = { x: number; y: number };

const palette = {
  ink: 0x28444a,
  green: 0x4f9b5d,
  deepGreen: 0x28704d,
  gold: 0xffc857,
  soil: 0x8e5838,
  soilDark: 0x633a29,
  sky: 0xbfeaff,
};

export class SceneRenderer {
  readonly root = new Container();
  private readonly background = new Graphics();
  private readonly far = new Container();
  private readonly middle = new Container();
  private readonly near = new Container();
  private readonly actors = new Container();
  private readonly particles = new Container();
  private current: SceneId = 'orchard';
  private width = 1;
  private height = 1;
  private time = 0;
  private animationToken = 0;
  private activeQuestions: Question[] = [];
  private activeIndex = 0;
  private activeUnlocked = new Set<number>();
  private actorRefs = new Map<number, Container>();
  private actorLabels = new Map<number, Container>();
  private smallRefs = new Map<string, Container>();
  private gardenFloatRefs: Array<{ crop: Container; baseY: number; phase: number; range: number }> = [];
  constructor() {
    this.root.addChild(this.background, this.far, this.middle, this.near, this.actors, this.particles);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.redraw();
  }

  setLevel(level: Level): void {
    this.current = level.id;
    this.activeQuestions = level.questions;
    this.activeIndex = 0;
    this.activeUnlocked = new Set();
    this.animationToken += 1;
    this.redraw();
  }

  showQuestion(question: Question, index: number, unlocked: Set<number>, questions: Question[] = this.activeQuestions): void {
    void question;
    this.activeQuestions = questions;
    this.activeIndex = index;
    this.activeUnlocked = new Set(unlocked);
    this.actors.removeChildren();
    this.actorRefs.clear();
    this.actorLabels.clear();
    this.smallRefs.clear();
    this.gardenFloatRefs.length = 0;
    if (this.current === 'orchard') this.renderOrchardActors(questions, unlocked);
    if (this.current === 'garden') this.renderGardenActors(questions, unlocked);
    if (this.current === 'classroom') this.renderClassroomActors(questions, unlocked);
    if (this.current === 'shop') this.renderShopActors(questions, unlocked);
  }

  private redraw(): void {
    this.clearLayers();
    this.renderBase();
    if (this.current === 'orchard') this.renderOrchard();
    if (this.current === 'garden') this.renderGarden();
    if (this.current === 'classroom') this.renderClassroom();
    if (this.current === 'shop') this.renderShop();
    if (this.activeQuestions.length > 0) {
      const question = this.activeQuestions[this.activeIndex];
      if (question) {
        this.actors.removeChildren();
        this.actorRefs.clear();
        this.actorLabels.clear();
        this.smallRefs.clear();
        if (this.current === 'orchard') this.renderOrchardActors(this.activeQuestions, this.activeUnlocked);
        if (this.current === 'garden') this.renderGardenActors(this.activeQuestions, this.activeUnlocked);
        if (this.current === 'classroom') this.renderClassroomActors(this.activeQuestions, this.activeUnlocked);
        if (this.current === 'shop') this.renderShopActors(this.activeQuestions, this.activeUnlocked);
      }
    }
  }

  playCorrect(question: Question, index: number): void {
    const token = ++this.animationToken;
    const center = this.positionFor(index);
    this.burst(center, this.current === 'garden' ? 'soil' : 'spark');
    const actor = this.actorRefs.get(index);
    const label = this.actorLabels.get(index);
    if (label) {
      label.removeChildren();
      label.addChild(this.current === 'garden'
        ? this.createCropArt(question, true, .86)
        : this.current === 'orchard'
          ? this.createOrchardFruitArt(question, true, 1.08)
          : this.createFruitArt(question, true));
    }
    if (this.current === 'garden' && label) {
      this.animateActor(label, 720, token, 1.06, 0);
    } else if (actor) {
      this.animateActor(actor, 720, token, 1.12);
    }
    for (let i = 0; i < 3; i += 1) {
      const small = this.smallRefs.get(`${index}-${i}`);
      if (small) {
        window.setTimeout(() => {
          if (token !== this.animationToken) return;
          small.alpha = 1;
          small.scale.set(1.25);
          window.setTimeout(() => {
            if (token === this.animationToken) small.scale.set(1);
          }, 180);
        }, 180 + i * 140);
      }
    }
    const badge = new Text({
      text: question.word,
      style: new TextStyle({ fill: 0xfff8bd, fontSize: 64, fontWeight: '700', stroke: { color: 0x8a542c, width: 5 } }),
    });
    badge.anchor.set(0.5);
    badge.position.set(center.x, center.y - 30);
    badge.alpha = 0;
    this.particles.addChild(badge);
    let elapsed = 0;
    const ticker = new Ticker();
    ticker.add(() => {
      elapsed += ticker.deltaMS;
      if (token !== this.animationToken) {
        ticker.stop();
        ticker.destroy();
        return;
      }
      const p = Math.min(elapsed / 850, 1);
      badge.alpha = Math.sin(p * Math.PI);
      badge.scale.set(0.7 + Math.sin(p * Math.PI) * 0.35);
      badge.y = center.y - 30 - p * 48;
      if (p >= 1) {
        ticker.stop();
        ticker.destroy();
        badge.destroy();
      }
    });
    ticker.start();
  }

  private animateActor(actor: Container, duration: number, token: number, peak: number, lift = 26): void {
    const startY = actor.y;
    let elapsed = 0;
    const ticker = new Ticker();
    ticker.add(() => {
      elapsed += ticker.deltaMS;
      if (token !== this.animationToken) {
        ticker.stop();
        ticker.destroy();
        return;
      }
      const p = Math.min(elapsed / duration, 1);
      const bounce = Math.sin(p * Math.PI);
      actor.scale.set(1 + bounce * (peak - 1));
      actor.y = startY - bounce * lift + (p > .7 ? Math.sin((p - .7) * 12) * 2 : 0);
      if (p >= 1) {
        actor.scale.set(1);
        actor.y = startY;
        ticker.stop();
        ticker.destroy();
      }
    });
    ticker.start();
  }

  playComplete(): void {
    const token = ++this.animationToken;
    for (let i = 0; i < 18; i += 1) {
      const point = { x: Math.random() * this.width, y: this.height * 0.25 + Math.random() * this.height * 0.55 };
      this.burst(point, i % 2 ? 'leaf' : 'spark');
    }
    window.setTimeout(() => {
      if (token === this.animationToken) this.renderCelebrationLabel();
    }, 120);
  }

  cancelAnimations(): void {
    this.animationToken += 1;
    this.particles.removeChildren();
  }

  tick(deltaMS: number): void {
    this.time += deltaMS;
    this.far.x = Math.sin(this.time / 8000) * 4;
    this.middle.x = Math.sin(this.time / 4600) * 3;
    this.near.x = Math.sin(this.time / 2400) * 2;
    this.gardenFloatRefs.forEach(({ crop, baseY, phase, range }) => {
      crop.y = baseY + Math.sin(this.time / 950 + phase) * range;
    });
  }

  destroy(): void {
    this.animationToken += 1;
    this.root.destroy({ children: true });
  }

  private clearLayers(): void {
    [this.far, this.middle, this.near, this.actors, this.particles].forEach((layer) => layer.removeChildren());
    this.gardenFloatRefs.length = 0;
  }

  private renderBase(): void {
    this.background.clear();
    if (this.current === 'garden') this.background.rect(0, 0, this.width, this.height).fill(0xb8e8ff);
    if (this.current === 'classroom') this.background.rect(0, 0, this.width, this.height).fill(0xdff1ff);
    if (this.current === 'shop') this.background.rect(0, 0, this.width, this.height).fill(0xffe8bc);
  }

  private renderOrchard(): void {
    this.addOrchardSun(this.far);
    this.addOrchardCloud(this.far, this.width * 0.13, this.height * 0.14, 0.9);
    this.addOrchardCloud(this.far, this.width * 0.8, this.height * 0.1, 0.64);
  }

  private renderGarden(): void {
    this.addFence(this.far);
    this.addHill(this.middle, 0.72, 0x8bc85d, 0.35);
    this.addGardenBeds(this.near);
    this.addText(this.near, '四季菜园', this.width / 2, this.height * 0.18, 0x477246, 28);
    this.addSun(this.far, this.width * 0.86, this.height * 0.12);
    this.addCloud(this.far, this.width * 0.13, this.height * 0.13, 0.8);
  }

  private renderClassroom(): void {
    this.addFloor(this.near, 0.82, 0xc89e67);
    const board = new Graphics().roundRect(this.width * 0.12, this.height * 0.2, this.width * 0.76, this.height * 0.38, 22).fill(0x293e42).stroke({ color: 0xc9b27a, width: 10 });
    this.middle.addChild(board);
    this.addText(this.middle, '把部件放回汉字里', this.width / 2, this.height * 0.39, 0xfff6cf, 25);
    this.addText(this.far, '✦  ✎  ✦', this.width / 2, this.height * 0.13, 0x5d92a1, 30);
  }

  private renderShop(): void {
    this.addFloor(this.near, 0.84, 0xd9af6d);
    const shelf = new Graphics().roundRect(this.width * 0.1, this.height * 0.19, this.width * 0.8, this.height * 0.5, 24).fill(0xa97942).stroke({ color: 0x704a2a, width: 8 });
    this.middle.addChild(shelf);
    for (let i = 1; i < 3; i += 1) {
      const line = new Graphics().rect(this.width * 0.12, this.height * (0.19 + i * 0.16), this.width * 0.76, 7).fill(0x704a2a);
      this.middle.addChild(line);
    }
    this.addText(this.far, '快乐商店', this.width / 2, this.height * 0.12, 0x875526, 28);
  }

  private renderOrchardActors(questions: Question[], unlocked: Set<number>): void {
    questions.forEach((question, itemIndex) => {
      const actor = new Container();
      actor.position.copyFrom(this.positionFor(itemIndex));
      const label = this.addFruit(actor, { x: 0, y: 0 }, question, unlocked.has(itemIndex));
      this.actorRefs.set(itemIndex, actor);
      this.actorLabels.set(itemIndex, label);
      this.actors.addChild(actor);
    });
  }

  private renderGardenActors(questions: Question[], unlocked: Set<number>): void {
    questions.forEach((question, itemIndex) => {
      const actor = new Container();
      actor.position.copyFrom(this.positionFor(itemIndex));
      const layout = this.gardenLayout();
      const bed = layout.beds[itemIndex % 2];
      const soilWidth = bed.w - 42;
      this.addSoilPlot(actor, { x: 0, y: 22 }, unlocked.has(itemIndex), soilWidth);
      const label = this.addCrop(actor, { x: 0, y: 0 }, question, unlocked.has(itemIndex), itemIndex, soilWidth);
      this.actorRefs.set(itemIndex, actor);
      this.actorLabels.set(itemIndex, label);
      this.actors.addChild(actor);
      this.addSmallFruits(actor, question, itemIndex, unlocked.has(itemIndex), soilWidth);
      this.gardenFloatRefs.push({
        crop: label,
        baseY: label.y,
        phase: itemIndex * 0.9,
        range: 3.5,
      });
    });
    this.addText(this.actors, '答对一题，蔬菜就会破土长大', this.width / 2, this.height * 0.86, 0x477246, 16);
  }

  private renderClassroomActors(questions: Question[], unlocked: Set<number>): void {
    void questions;
    void unlocked;
  }

  private renderShopActors(questions: Question[], unlocked: Set<number>): void {
    void questions;
    void unlocked;
  }

  private addFruit(layer: Container, point: Point, question: Question, active: boolean): Container {
    const fruit = this.current === 'orchard'
      ? this.createOrchardFruitArt(question, active)
      : this.createFruitArt(question, active);
    fruit.position.set(point.x, point.y);
    layer.addChild(fruit);
    return fruit;
  }

  private addCrop(layer: Container, point: Point, question: Question, active: boolean, index: number, soilWidth: number): Container {
    const crop = new Container();
    const scale = this.gardenCropScale(index, active);
    crop.addChild(this.createCropArt(question, active, scale));
    crop.position.set(point.x - soilWidth * .3, point.y + 22);
    layer.addChild(crop);
    return crop;
  }

  private addSmallFruits(layer: Container, question: Question, index: number, active: boolean, soilWidth: number): void {
    const offsets = [-soilWidth * .08, soilWidth * .14, soilWidth * .36];
    offsets.forEach((offset, smallIndex) => {
      const scale = .28 + ((index + smallIndex) % 3) * .035;
      const small = this.createCropArt(question, active, scale);
      small.position.set(offset, 22);
      small.alpha = active ? 1 : 0.62;
      layer.addChild(small);
      this.smallRefs.set(`${index}-${smallIndex}`, small);
      this.gardenFloatRefs.push({
        crop: small,
        baseY: small.y,
        phase: index * .9 + smallIndex * .7,
        range: 2.5,
      });
    });
  }

  private addSoilPlot(layer: Container, point: Point, active: boolean, width: number): void {
    const height = 58;
    const plot = new Graphics()
      .roundRect(point.x - width / 2, point.y - height / 2, width, height, 22)
      .fill(active ? 0xa8693d : palette.soil)
      .stroke({ color: active ? 0xe0a067 : 0xc78a50, width: 5 });
    const furrow = new Graphics()
      .ellipse(point.x, point.y + 5, Math.min(width * .36, 110), 11)
      .fill({ color: active ? 0x724226 : palette.soilDark, alpha: .38 });
    layer.addChild(plot, furrow);
  }

  private createFruitArt(question: Question, active: boolean, scale = 1): Container {
    const fruit = new Container();
    const gray = 0xb4bbb6;
    const darkGray = 0x7f8983;
    const word = question.fullWord;
    const drawLeaf = (x: number, y: number): void => {
      fruit.addChild(new Graphics().ellipse(x, y, 9, 18).fill(active ? 0x3f8f43 : darkGray));
      fruit.children[fruit.children.length - 1].rotation = 0.72;
    };
    const color = (value: number): number => active ? value : gray;
    const strokeColor = active ? 0x6b3a24 : darkGray;

    if (word.includes('苹果')) {
      fruit.addChild(new Graphics().circle(-14, 8, 28).circle(14, 8, 28).ellipse(0, 17, 34, 31).fill(color(0xd93b32)).stroke({ color: strokeColor, width: 3 }));
      fruit.addChild(new Graphics().roundRect(-4, -30, 8, 24, 4).fill(active ? 0x784322 : darkGray));
      drawLeaf(14, -28);
      fruit.addChild(new Graphics().ellipse(-13, 1, 8, 13).fill({ color: active ? 0xff9080 : 0xd5d9d6, alpha: .62 }));
    } else if (word.includes('柿')) {
      fruit.addChild(new Graphics().ellipse(0, 15, 36, 29).fill(color(0xf08a24)).stroke({ color: strokeColor, width: 3 }));
      for (let i = 0; i < 4; i += 1) {
        const leaf = new Graphics().ellipse(0, -8, 9, 22).fill(active ? 0x4f8c3e : darkGray);
        leaf.rotation = i * Math.PI / 2 + .18;
        fruit.addChild(leaf);
      }
      fruit.addChild(new Graphics().circle(0, -8, 8).fill(active ? 0x627a2e : darkGray));
    } else if (word.includes('葡萄')) {
      const grapeColor = color(0x7b58ba);
      [[0, -15], [-15, 1], [15, 1], [-8, 18], [8, 18], [0, 35]].forEach(([x, y]) => {
        fruit.addChild(new Graphics().circle(x, y, 15).fill(grapeColor).stroke({ color: active ? 0x503a80 : darkGray, width: 2 }));
      });
      drawLeaf(17, -32);
    } else if (word.includes('樱桃')) {
      fruit.addChild(new Graphics().circle(-18, 17, 22).fill(color(0xd73a44)).stroke({ color: strokeColor, width: 3 }));
      fruit.addChild(new Graphics().circle(20, 20, 22).fill(color(0xe44751)).stroke({ color: strokeColor, width: 3 }));
      fruit.addChild(new Graphics().moveTo(-18, -4).quadraticCurveTo(-10, -34, 0, -40).moveTo(20, -2).quadraticCurveTo(8, -34, 0, -40).stroke({ color: active ? 0x5f7d31 : darkGray, width: 4 }));
      drawLeaf(11, -40);
    } else if (word.includes('香蕉')) {
      fruit.addChild(new Graphics().moveTo(-38, 1).quadraticCurveTo(-5, 56, 39, 5).quadraticCurveTo(4, 82, -43, 15).closePath().fill(color(0xf0c33b)).stroke({ color: active ? 0x9b7a25 : darkGray, width: 4 }));
    } else if (word.includes('梨')) {
      fruit.addChild(new Graphics().ellipse(0, 19, 31, 38).fill(color(0xdccf54)).stroke({ color: strokeColor, width: 3 }));
      fruit.addChild(new Graphics().circle(0, -9, 21).fill(color(0xdccf54)).stroke({ color: strokeColor, width: 3 }));
      drawLeaf(15, -34);
    } else if (word.includes('芒果')) {
      fruit.addChild(new Graphics().ellipse(0, 13, 30, 43).fill(color(0xf0b23e)).stroke({ color: strokeColor, width: 3 }));
      fruit.rotation = -.38;
      drawLeaf(17, -33);
    } else if (word.includes('柠檬')) {
      fruit.addChild(new Graphics().ellipse(0, 12, 40, 26).fill(color(0xf1d84f)).stroke({ color: strokeColor, width: 3 }));
      drawLeaf(17, -22);
    } else if (word.includes('橙')) {
      fruit.addChild(new Graphics().circle(0, 12, 35).fill(color(0xf28a24)).stroke({ color: strokeColor, width: 3 }));
      fruit.addChild(new Graphics().circle(0, 12, 24).stroke({ color: active ? 0xffbd55 : 0xd6d9d6, width: 2, alpha: .65 }));
      drawLeaf(13, -25);
    } else {
      fruit.addChild(new Graphics().circle(0, 12, 34).fill(color(0xf28aa5)).stroke({ color: strokeColor, width: 3 }));
      drawLeaf(13, -25);
    }

    fruit.scale.set(scale);
    fruit.alpha = active ? 1 : .82;
    return fruit;
  }

  private createOrchardFruitArt(question: Question, active: boolean, scale = 1): Container {
    const fruit = new Container();
    const icon = new Text({
      text: question.fruitEmoji ?? question.fruit,
      style: new TextStyle({
        fontSize: 58,
        fill: 0xffffff,
        stroke: { color: 0x6f4928, width: 4 },
      }),
    });
    icon.anchor.set(0.5);
    icon.alpha = 1;
    fruit.addChild(icon);
    fruit.scale.set(scale);
    fruit.alpha = active ? 1 : 0;
    return fruit;
  }

  private createCropArt(question: Question, active: boolean, scale = 1): Container {
    const crop = new Container();
    const icon = new Text({
      text: active ? question.fruitEmoji ?? '🥬' : '🌱',
      style: new TextStyle({ fontSize: active ? 78 : 42, fill: active ? 0xffffff : 0xaab4ad }),
    });
    icon.anchor.set(0.5);
    crop.addChild(icon);
    crop.scale.set(scale);
    crop.alpha = active ? 1 : .86;
    return crop;
  }

  private gardenCropScale(index: number, active: boolean): number {
    const base = active ? .56 : .5;
    return base + (index % 3) * .025;
  }

  private positionFor(index: number): Point {
    if (this.current === 'garden') {
      const layout = this.gardenLayout();
      const bed = layout.beds[index % 2];
      return { x: bed.x + bed.w / 2, y: layout.rowYs[Math.floor(index / 2) % layout.rowYs.length] };
    }
    if (this.current === 'classroom') {
      const columns = 4;
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: this.width * (0.08 + (column + .5) * (0.84 / columns)),
        y: this.height * (0.36 + row * 0.22),
      };
    }
    if (this.current === 'shop') {
      const column = index % 3;
      const row = Math.floor(index / 3);
      return {
        x: this.width * (0.42 + column * 0.19),
        y: this.height * (0.36 + row * 0.2),
      };
    }
    const treeWidth = this.width < 600
      ? Math.min(this.width * 1.72, (this.height - 110) * 1.04, 860)
      : Math.min(this.width * 1.04, (this.height - 80) * 1.12, 1120);
    const treeLeft = (this.width - treeWidth) / 2;
    const treeTop = this.width < 600
      ? 132
      : Math.min(Math.max(116, this.height * .15), 178);
    const treeScale = treeWidth / 500;
    // These points stay inside the leafy part of the 500 x 500 tree artwork.
    const canopyPoints: Point[] = [
      { x: 126, y: 116 },
      { x: 190, y: 82 },
      { x: 310, y: 82 },
      { x: 374, y: 116 },
      { x: 112, y: 184 },
      { x: 184, y: 218 },
      { x: 316, y: 218 },
      { x: 388, y: 184 },
    ];
    const point = canopyPoints[index % canopyPoints.length];
    return {
      x: treeLeft + point.x * treeScale,
      y: treeTop + point.y * treeScale,
    };
  }

  private gardenLayout(): { beds: Array<{ x: number; y: number; w: number; h: number }>; rowYs: number[] } {
    const top = this.height * 0.31;
    const height = this.height * 0.52;
    const gap = Math.max(28, this.width * 0.08);
    const margin = Math.max(20, this.width * 0.04);
    const bedWidth = (this.width - gap - margin * 2) / 2;
    const beds = [
      { x: margin, y: top, w: bedWidth, h: height },
      { x: margin + bedWidth + gap, y: top, w: bedWidth, h: height },
    ];
    const rowYs = Array.from({ length: 4 }, (_, index) => top + height * (0.1 + index * 0.24));
    return { beds, rowYs };
  }

  private burst(point: Point, type: 'soil' | 'spark' | 'leaf'): void {
    const glyph = type === 'soil' ? '•' : type === 'leaf' ? '🍃' : '✦';
    for (let i = 0; i < 9; i += 1) {
      const particle = new Text({ text: glyph, style: new TextStyle({ fontSize: type === 'soil' ? 18 : 22, fill: type === 'soil' ? 0x8c5733 : 0xffe16b }) });
      particle.anchor.set(0.5);
      particle.position.set(point.x, point.y);
      particle.alpha = 0.95;
      this.particles.addChild(particle);
      const angle = (Math.PI * 2 * i) / 9;
      const distance = 28 + Math.random() * 48;
      const targetX = point.x + Math.cos(angle) * distance;
      const targetY = point.y + Math.sin(angle) * distance;
      let elapsed = 0;
      const ticker = new Ticker();
      ticker.add(() => {
        elapsed += ticker.deltaMS;
        const progress = Math.min(elapsed / 700, 1);
        particle.position.set(
          point.x + (targetX - point.x) * progress,
          point.y + (targetY - point.y) * progress + progress * progress * 34,
        );
        particle.alpha = 1 - progress;
        particle.scale.set(1 - progress * .35);
        if (progress >= 1) {
          ticker.stop();
          ticker.destroy();
          particle.destroy();
        }
      });
      ticker.start();
    }
  }

  private renderCelebrationLabel(): void {
    const label = new Text({ text: this.current === 'garden' ? '菜园丰收啦！' : '汉字果园亮起来啦！', style: new TextStyle({ fontSize: 30, fill: 0xfff4b8, stroke: { color: 0x765027, width: 5 }, fontWeight: '700' }) });
    label.anchor.set(0.5);
    label.position.set(this.width / 2, this.height * 0.2);
    this.particles.addChild(label);
    window.setTimeout(() => label.destroy(), 2200);
  }

  private addHill(layer: Container, yRatio: number, color: number, alpha: number): void {
    layer.addChild(new Graphics().ellipse(this.width / 2, this.height * yRatio, this.width * 0.82, this.height * 0.3).fill({ color, alpha }));
  }

  private addFloor(layer: Container, yRatio: number, color: number): void {
    layer.addChild(new Graphics().rect(0, this.height * yRatio, this.width, this.height * (1 - yRatio)).fill(color));
  }

  private addOrchardSun(layer: Container): void {
    const sun = new Graphics()
      .circle(this.width * .86, this.height * .12, 29)
      .fill(0xffd766);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      sun.moveTo(this.width * .86 + Math.cos(angle) * 40, this.height * .12 + Math.sin(angle) * 40)
        .lineTo(this.width * .86 + Math.cos(angle) * 51, this.height * .12 + Math.sin(angle) * 51)
        .stroke({ color: 0xffd766, width: 5, cap: 'round' });
    }
    layer.addChild(sun);
  }

  private addOrchardCloud(layer: Container, x: number, y: number, scale: number): void {
    const cloud = new Graphics()
      .ellipse(x - 30, y + 8, 42, 20)
      .ellipse(x + 8, y, 48, 26)
      .ellipse(x + 48, y + 10, 36, 18)
      .fill({ color: 0xffffff, alpha: .74 });
    cloud.scale.set(scale);
    layer.addChild(cloud);
  }

  private addGardenBeds(layer: Container): void {
    const { beds } = this.gardenLayout();
    beds.forEach((bed) => {
      const base = new Graphics()
        .roundRect(bed.x, bed.y, bed.w, bed.h, 34)
        .fill(0x9a5f39)
        .stroke({ color: 0x6f3f25, width: 7 });
      layer.addChild(base);
      for (let i = 1; i < 4; i += 1) {
        const y = bed.y + (bed.h * i) / 4;
        layer.addChild(new Graphics()
          .roundRect(bed.x + 18, y - 8, bed.w - 36, 16, 8)
          .fill({ color: 0x6f3f25, alpha: .32 }));
      }
    });
    layer.addChild(new Graphics()
      .roundRect(this.width * 0.46, beds[0].y - 10, this.width * 0.08, beds[0].h + 20, 28)
      .fill(0xf2d799));
  }

  private addFence(layer: Container): void {
    layer.addChild(new Graphics().rect(0, this.height * 0.25, this.width, 12).fill(0xc5844d));
    for (let i = 0; i < 11; i += 1) layer.addChild(new Graphics().roundRect(i * (this.width / 10) - 11, this.height * 0.19, 22, 86, 9).fill(0xe2a35a));
  }

  private addSun(layer: Container, x: number, y: number): void {
    layer.addChild(new Text({ text: '☀️', style: new TextStyle({ fontSize: 48 }) })).position.set(x, y);
  }

  private addCloud(layer: Container, x: number, y: number, scale: number): void {
    const cloud = new Text({ text: '☁️', style: new TextStyle({ fontSize: 46 }) });
    cloud.position.set(x, y);
    cloud.scale.set(scale);
    layer.addChild(cloud);
  }

  private addText(layer: Container, text: string, x: number, y: number, color: number, fontSize: number): Text {
    const label = new Text({ text, style: new TextStyle({ fill: color, fontSize, fontWeight: '700', align: 'center' }) });
    label.anchor.set(0.5);
    label.position.set(x, y);
    layer.addChild(label);
    return label;
  }
}
