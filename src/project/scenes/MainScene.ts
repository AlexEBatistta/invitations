import type { Graphics } from "pixi.js";
import { Sprite } from "pixi.js";
import { Rectangle } from "pixi.js";
import { Container } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Names } from "./parts/Names";
import { ScrollView, ScrollViewEvents } from "../../engine/ui/scrollview/ScrollView";
import { Location } from "./parts/Location";
import { Photos } from "./parts/Photos";
import { Payment } from "./parts/Payment";
import { Confirmation } from "./parts/Confirmation";
import { DressCode } from "./parts/DressCode";
import { SongsList } from "./parts/SongsList";
import { FinalGreeting } from "./parts/FinalGreeting";
import type { BaseParts } from "./parts/BaseParts";
import { FB_DATABASE, Manager } from "../..";
import { SoundLib } from "../../engine/sound/SoundLib";
import { GraphicsHelper } from "../../engine/utils/GraphicsHelper";
import { ColorDictionary } from "../../engine/utils/Constants";
import { DEBUG } from "../../flags";
import type { IScene } from "../../engine/scenemanager/IScene";
import { get, ref } from "firebase/database";
import { DataManager } from "../../engine/datamanager/DataManager";
import { setPivotToCenter } from "../../engine/utils/MathUtils";
import { Button } from "../../engine/ui/button/Button";
import { generateData } from "../../engine/utils/Utils";
import { saveAs } from "file-saver";
import { Countdown } from "./parts/Countdown";
import { Message } from "./parts/Message";

// https://alexebatistta.github.io/invitations
export class MainScene extends PixiScene {
	public static readonly BUNDLES = ["package-1", "music"];
	private photoBackground: Container;
	private scrollView: ScrollView;
	private centerContainer: Container;
	private namesContainer: Names;
	private contentScale: number;
	private arrowInput: Graphics;
	public static songList: Array<string> = new Array();
	public static guestNames: Array<string> = new Array(2);
	private btnSave: Button;
	constructor() {
		super();

		MainScene.guestNames[0] = DataManager.getValue("guest 0");
		MainScene.guestNames[1] = DataManager.getValue("guest 1");

		// savedate.com.ar/alex&mica?sd=ml
		this.createParts();
		this.scrollView = new ScrollView(this.centerContainer.width, this.centerContainer.height, {
			addToContent: this.centerContainer,
			useInnertia: true,
			scrollLimits: new Rectangle(0, 0, this.centerContainer.width, this.centerContainer.height),
			useMouseWheel: false,
			events: this.events,
		});
		this.scrollView.pivot.x = this.scrollView.width / 2;
		this.addChild(this.scrollView);

		this.arrowInput = GraphicsHelper.pixel(0xffffff);
		this.arrowInput.pivot.set(0.5, 0);
		this.arrowInput.alpha = 0.001;
		this.arrowInput.interactive = true;
		this.arrowInput.cursor = "pointer";
		this.arrowInput.on("pointertap", () => this.scrollView.scrollInnertia(0, -this.centerContainer.y));
		this.events.on(ScrollViewEvents.SCROLL_END, (posY: number) => {
			this.arrowInput.interactive = Math.abs(posY) < 100;
		});
		this.addChild(this.arrowInput);

		SoundLib.playMusic("music");
		SoundLib.muteMusic = DEBUG;

		get(ref(FB_DATABASE, "songList"))
			.then((snapshot) => {
				if (snapshot.exists()) {
					const data = snapshot.val();
					MainScene.songList = Object.values<string>(data).filter((_value, index) => {
						return data.hasOwnProperty(`song ${index}`);
					});
				}
			})
			.catch((error) => {
				console.error("Error al obtener datos:", error);
			});

		// ?1502
		if (new URLSearchParams(window.location.search).get("1502") != undefined) {
			const btnSprite: Sprite = Sprite.from("package-1/saveIcon.png");
			setPivotToCenter(btnSprite);

			this.btnSave = new Button({
				defaultState: { content: btnSprite, scale: 1 },
				highlightState: { scale: 1.05, tween: true },
				onClick: () => {
					get(ref(FB_DATABASE)).then((rawData) => {
						const blob = new Blob([generateData(rawData.val())], { type: "text/plain;charset=utf-8" });
						saveAs(blob, "datos.txt");
					});
				},
				fixedCursor: "pointer",
			});
			this.addChild(this.btnSave);
		}
	}

	public override onShow(): void {
		this.scrollView.setMouseWheel(true);
	}

	public createParts(): void {
		this.photoBackground = new Container();
		this.addChild(this.photoBackground);

		const photo: Sprite = Sprite.from("cover_photo");
		photo.anchor.set(0.5);
		// photo.filters = [new AdjustmentFilter({ saturation: 0.4 })];
		this.photoBackground.addChild(photo);

		const gradient: Sprite = Sprite.from("gradient");
		gradient.anchor.set(0.5);
		this.photoBackground.addChild(gradient);

		const overPhoto: Graphics = GraphicsHelper.pixel(ColorDictionary.black, 0.35);
		overPhoto.pivot.set(0.5);
		overPhoto.scale.set(photo.width, photo.height);
		this.photoBackground.addChild(overPhoto);

		this.centerContainer = new Container();

		this.namesContainer = new Names();
		this.addChild(this.namesContainer);

		this.centerContainer.y = this.namesContainer.height;

		const parts: Array<BaseParts> = new Array(
			new Location(),
			new Photos(),
			new Payment(),
			new DressCode(),
			new SongsList(),
			new Confirmation(),
			new Countdown("30/03/2024", "19:30"),
			new Message(),
			new FinalGreeting()
		);

		for (let i = 0; i < parts.length; i++) {
			if (i > 0) {
				parts[i].y = parts[i - 1].y + parts[i - 1].height;
			}
			this.centerContainer.addChild(parts[i]);
		}

		this.centerContainer.pivot.set(-this.centerContainer.width * 0.5, 0);
	}

	public override update(_dt: number): void {
		this.scrollView.updateDragging();
	}

	public override onChangeOrientation(): void {
		this.namesContainer.onChangeOrientation();
		const contentParts: BaseParts[] = this.scrollView.content.children[0].children as BaseParts[];
		for (let i = 0; i < contentParts.length; i++) {
			const part = contentParts[i];
			part.onChangeOrientation();

			if (i > 0) {
				part.y = contentParts[i - 1].y + contentParts[i - 1].height;
			}
		}

		this.scrollView.updateScrollLimits(undefined, this.centerContainer.height);
		this.scrollView.scrollHeight = Manager.height / (this.contentScale ?? 1);
		this.scrollView.constraintRectangle();
	}

	public override onPopupOpen(_popupReference: IScene, _popupParams?: any[]): void {
		this.scrollView.setMouseWheel(false);
	}

	public override onPopupClose(_popupClass: new (...args: any[]) => IScene, _lastWords?: any): void {
		this.scrollView.setMouseWheel(true);
	}

	public override onResize(newW: number, newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.photoBackground, newW, newH, 1, 1, Math.max);
		this.photoBackground.position.set(newW / 2, Manager.isPortrait ? newH / 2 : newH / 2);

		this.contentScale = ScaleHelper.screenScale(ScaleHelper.IDEAL_WIDTH, ScaleHelper.IDEAL_HEIGHT, newW, newH, 1, 1, Math.max);
		this.namesContainer.scale.set(this.contentScale);
		this.centerContainer.y = newH / this.contentScale;
		this.scrollView.scale.set(this.contentScale);

		if (this.scrollView.width > newW) {
			this.contentScale = ScaleHelper.screenScale(ScaleHelper.IDEAL_WIDTH, ScaleHelper.IDEAL_HEIGHT, newW, newH, 1, 1, Math.min);

			this.namesContainer.scale.set(this.contentScale);

			this.centerContainer.y = newH / this.contentScale;
			this.scrollView.scale.set(this.contentScale);
		}

		this.namesContainer.position.set(newW / 2, 0);
		this.scrollView.position.set(newW / 2, 0);

		this.scrollView.updateScrollLimits(undefined, this.centerContainer.height + this.centerContainer.y);
		this.scrollView.scrollHeight = newH / this.contentScale;
		this.scrollView.constraintRectangle();

		this.namesContainer.onChangeOrientation();

		const arrow = this.namesContainer.getArrowBounds();
		this.arrowInput.scale.set(arrow.width * 2 * this.namesContainer.scale.x, arrow.height * 3 * this.namesContainer.scale.y);
		this.arrowInput.position.set(newW / 2, newH - this.arrowInput.height * 1.75);

		this.btnSave?.scale.set(this.contentScale);
		this.btnSave?.position.set(this.btnSave.width, this.btnSave.height);
	}
}
