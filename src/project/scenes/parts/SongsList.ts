import i18next from "i18next";
import type { Graphics } from "pixi.js";
import { Container, Text } from "pixi.js";
import { Manager } from "../../..";
import { SDFBitmapText } from "../../../engine/sdftext/SDFBitmapText";
import { Button } from "../../../engine/ui/button/Button";
import { ColorDictionary, Offsets, SDFTextStyleDictionary, TextStyleDictionary } from "../../../engine/utils/Constants";
import { GraphicsHelper } from "../../../engine/utils/GraphicsHelper";
import { setPivotToCenter } from "../../../engine/utils/MathUtils";
import { SongsListPopup } from "../../popups/SongsListPopup";
import { MainScene } from "../MainScene";
import { BaseParts } from "./BaseParts";

export class SongsList extends BaseParts {
	constructor() {
		super(1, ColorDictionary.black, 721);

		this.title = new SDFBitmapText(i18next.t("SongsList.title"), SDFTextStyleDictionary.titleWhite);
		this.title.anchor.x = 0.5;
		this.addChild(this.title);

		this.text = new Text(i18next.t("SongsList.text"), TextStyleDictionary.textWhite);
		this.text.anchor.x = 0.5;
		this.addChild(this.text);

		const btnContent: Container = new Container();
		const btnBack: Graphics = GraphicsHelper.pixel(ColorDictionary.white);
		btnBack.pivot.x = 0.5;
		btnBack.scale.set(520, 90);
		btnContent.addChild(btnBack);
		const btnText: Text = new Text(i18next.t("SongsList.button"), TextStyleDictionary.buttonBlack);
		setPivotToCenter(btnText);
		btnText.y = btnBack.height / 2;
		btnContent.addChild(btnText);

		this.button = new Button({
			defaultState: { content: btnContent, scale: 1 },
			highlightState: { scale: 1.05, tween: true },
			onClick: () => {
				Manager.openPopup(SongsListPopup, [MainScene.songList]);
			},
			fixedCursor: "pointer",
		});
		this.addChild(this.button);

		this.onChangeOrientation();
	}

	public override onChangeOrientation(): void {
		super.onChangeOrientation();

		this.title.y = Offsets.top;
		this.text.y = this.title.y + this.title.height + Offsets.text;
		this.button.y = this.text.y + this.text.height + Offsets.button;
		this.background.height = this.button.y + this.button.height + Offsets.bottom;
	}
}
