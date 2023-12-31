import { Sprite } from "pixi.js";
import { Graphics } from "pixi.js";
import { Container } from "pixi.js";
import { Tween } from "tweedle.js";
import { Manager } from "../..";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { SDFBitmapText } from "../../engine/sdftext/SDFBitmapText";
import { Button } from "../../engine/ui/button/Button";
import { ColorDictionary, SDFTextStyleDictionary } from "../../engine/utils/Constants";
import { GraphicsHelper } from "../../engine/utils/GraphicsHelper";
import { setPivotToCenter } from "../../engine/utils/MathUtils";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";

export class BasePopup extends PixiScene {
	protected overlay: Graphics;
	protected background: Graphics;
	protected title: SDFBitmapText;
	protected centerContainer: Container;
	protected backTop: Graphics;
	protected backBottom: Graphics;
	protected logo: Sprite;
	protected btnClose: Button;
	protected backgroundContainer: Container;
	protected auxFrame: Graphics;
	protected waitKeyboard: boolean = false;
	constructor(title: string) {
		super();

		this.overlay = GraphicsHelper.pixel(ColorDictionary.black, 1);
		this.overlay.alpha = 0;
		this.overlay.interactive = true;
		setPivotToCenter(this.overlay);
		this.addChild(this.overlay);

		this.backgroundContainer = new Container();
		this.addChild(this.backgroundContainer);

		this.background = GraphicsHelper.pixel(ColorDictionary.white);
		this.background.pivot.x = 0.5;
		this.backgroundContainer.addChild(this.background);

		this.backTop = GraphicsHelper.pixel(ColorDictionary.black);
		this.backTop.pivot.x = 0.5;
		this.backTop.y = 130;
		this.backgroundContainer.addChild(this.backTop);

		this.backBottom = GraphicsHelper.pixel(ColorDictionary.black);
		this.backBottom.pivot.set(0.5, 1);
		this.backgroundContainer.addChild(this.backBottom);

		this.centerContainer = new Container();
		this.addChild(this.centerContainer);

		this.title = new SDFBitmapText(title, SDFTextStyleDictionary.titleWhite);
		setPivotToCenter(this.title);
		this.centerContainer.addChild(this.title);

		this.logo = Sprite.from("package-1/miniLogo.png");
		setPivotToCenter(this.logo);
		this.centerContainer.addChild(this.logo);

		const btnContent: Container = new Container();
		const btnBack: Graphics = GraphicsHelper.pixel(ColorDictionary.white);
		setPivotToCenter(btnBack);
		btnBack.scale.set(100);
		btnContent.addChild(btnBack);
		const btnSprite: Sprite = Sprite.from("package-1/btnClose.png");
		setPivotToCenter(btnSprite);
		btnSprite.y = -5;
		btnContent.addChild(btnSprite);

		this.btnClose = new Button({
			defaultState: { content: btnContent, scale: 1 },
			highlightState: { scale: 1.05, tween: true },
			onClick: () => {
				this.closePopup();
			},
			fixedCursor: "pointer",
		});
		this.centerContainer.addChild(this.btnClose);

		this.auxFrame = new Graphics();
		this.centerContainer.addChild(this.auxFrame);

		this.scaleBackground();
		this.centerContainer.visible = false;
	}

	private scaleBackground(): void {
		this.background.scale.set(ScaleHelper.IDEAL_WIDTH, ScaleHelper.IDEAL_HEIGHT);
		this.backTop.scale.set(ScaleHelper.IDEAL_WIDTH, Manager.isPortrait ? 222 : 155);
		this.backBottom.scale.set(ScaleHelper.IDEAL_WIDTH, Manager.isPortrait ? 222 : 155);
		this.backBottom.y = ScaleHelper.IDEAL_HEIGHT;

		this.auxFrame.clear();
		this.auxFrame.lineStyle(1, ColorDictionary.white, 0.001).drawRect(-ScaleHelper.IDEAL_WIDTH / 2, 0, ScaleHelper.IDEAL_WIDTH, ScaleHelper.IDEAL_HEIGHT);

		this.title.y = this.backTop.y + this.backTop.height / 2;
		this.logo.height = this.backBottom.height - 77;
		this.logo.scale.x = this.logo.scale.y;
		this.logo.y = this.backBottom.y - this.backBottom.height / 2;
		this.btnClose.position.set(ScaleHelper.IDEAL_WIDTH / 2 - 85, 130 / 2);

		setPivotToCenter(this.backgroundContainer);
		setPivotToCenter(this.centerContainer);
	}

	public override onShow(): void {
		const scaleContainer = this.backgroundContainer.scale.x;
		this.backgroundContainer.scale.x = 0;
		new Tween(this.overlay)
			.to({ alpha: 0.8 }, 250)
			.onComplete(() => {
				new Tween(this.backgroundContainer.scale)
					.to({ x: scaleContainer }, 250)
					.onComplete(() => (this.centerContainer.visible = true))
					.start();
			})
			.start();
	}

	protected closePopup(): void {
		this.centerContainer.visible = false;
		new Tween(this.backgroundContainer.scale)
			.to({ x: 0 }, 250)
			.onComplete(() => {
				new Tween(this.overlay).to({ alpha: 0 }, 250).onComplete(this.closeHandler.bind(this)).start();
			})
			.start();
	}

	public override onResize(newW: number, newH: number): void {
		this.overlay.scale.set(newW, newH);
		this.overlay.position.set(newW * 0.5, newH * 0.5);

		this.scaleBackground();

		ScaleHelper.setScaleRelativeToScreen(this.backgroundContainer, newW, newH, 0.9, 0.9);
		this.backgroundContainer.x = newW * 0.5;

		this.centerContainer.scale = this.backgroundContainer.scale;
		this.centerContainer.x = this.backgroundContainer.x;

		if (!Manager.onKeyboard) {
			this.backgroundContainer.y = newH * 0.5;
			this.centerContainer.y = this.backgroundContainer.y;
		}
	}
}
