import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ItemCard, Direction, GestureState } from '../types';
import { dataCard } from '../constant';
import { BehaviorSubject } from 'rxjs';

import {
  GestureHandlerStateEvent as NSGestureHandlerStateEvent,
  GestureHandlerTouchEvent as NSGestureHandlerTouchEvent,
  GestureStateEventData as NSGestureStateEventData,
  GestureTouchEventData as NSGestureTouchEventData,
  HandlerType as NSHandlerType,
  Manager as NSManager,
} from '@nativescript-community/gesturehandler';
import { CoreTypes, View, isIOS } from '@nativescript/core';

@Component({
  selector: 'swipeable-cards',
  templateUrl: './swipeable-cards.component.html',
  styleUrls: ['./swipeable-cards.component.css'],
})
export class SwipeableCardsComponent implements OnInit {
  @ViewChild('gestureRootView') gestureRootView: ElementRef;
  @ViewChild('cardContainer') cardContainer: ElementRef;

  cards$ = new BehaviorSubject<ItemCard[]>(dataCard.reverse());
  currentView$ = new BehaviorSubject<number>(this.cards$.value.length - 1);

  constructor() {}

  ngOnInit(): void {}

  manager = NSManager.getInstance();

  private getGestureHandler = () => {
    const gestureHandler = this.manager.createGestureHandler(
      NSHandlerType.PAN,
      10,
      {
        shouldCancelWhenOutside: false,
      }
    );

    gestureHandler.on(
      NSGestureHandlerTouchEvent,
      this.onGestureTouch as () => void
    );
    gestureHandler.on(
      NSGestureHandlerStateEvent,
      this.onGestureState as () => void
    );
    return gestureHandler;
  };

  private onGestureTouch(args: NSGestureTouchEventData) {
    const { state, extraData, view } = args.data;
    if (view) {
      view.translateX = extraData.translationX;
      view.translateY =
        extraData.translationY + this.getTranslateY(this.currentView$.value);
      view.rotate = extraData.translationX * (isIOS ? 0.05 : 0.1);
    }
  }

  private getScale = (index: number) =>
    this.normalizeRange(
      this.currentPosition(index),
      this.cards$.value.length,
      0
    );
  private getTranslateY = (index: number) =>
    this.normalizeRange(
      this.currentPosition(index),
      0,
      this.cards$.value.length
    ) * 300;
  private normalizeRange = (val: number, max: number, min: number) =>
    (val - min) / (max - min);
  private currentPosition = (index: number) =>
    this.cards$.value.length - this.currentView$.value + index;
  private isFirstCard = (index: number) =>
    index === this.cards$.value.length - 1;
  private hasMoreCards = () => this.currentView$.value >= 0;
  private like = () =>
    this.outCard(this.cards$.value[this.currentView$.value], Direction.Right);
  private discard = () =>
    this.outCard(this.cards$.value[this.currentView$.value], Direction.Left);

  private outCard(card: ItemCard, direction: Direction) {
    if (this.hasMoreCards()) {
      card.view.animate({
        rotate: direction === Direction.Left ? -40 : 40,
        translate: {
          x: direction === Direction.Left ? -500 : 500,
          y: 100,
        },
        duration: 250,
      });
      this.currentView$.next(this.currentView$.value - 1);
      if (this.currentView$.value >= 0) {
        this.getGestureHandler().attachToView(
          this.cards$.value[this.currentView$.value].view
        );
        this.applyTranslateY();
      } else {
        //finish
      }
    }
  }

  private applyTranslateY() {
    for (let index = 0; index < this.currentView$.value + 1; index++) {
      const card = this.cards$.value[index];
      if (index <= this.currentView$.value) {
        card.view.animate({
          translate: {
            y: this.getTranslateY(index),
            x: 0,
          },
          scale: {
            x: this.getScale(index),
            y: this.getScale(index),
          },
          duration: 250,
        });
      }
    }
  }

  private resetCard(card: ItemCard, indexView: number) {
    card.view.animate({
      rotate: 0,
      translate: {
        x: 0,
        y: this.getTranslateY(indexView),
      },
      scale: {
        x: this.getScale(indexView),
        y: this.getScale(indexView),
      },
      duration: 250,
      curve: CoreTypes.AnimationCurve.cubicBezier(0.17, 0.89, 0.24, 1.2),
    });
  }

  private onGestureState(args: NSGestureStateEventData) {
    const { state, prevState, extraData, view } = args.data;
    if (state === GestureState.END) {
      const card = this.cards$[this.currentView$.value];
      if (extraData.translationX >= 200 || extraData.translationX <= -200) {
        this.outCard(
          card,
          extraData.translationX >= 200 ? Direction.Right : Direction.Left
        );
      } else {
        this.resetCard(card, this.currentView$.value);
      }
    }
  }

  loadedCard(args: { object: View }, index: number) {
    if (!this.cards$.value[index].view) {
      this.cards$.value[index].view = args.object;
      args.object.scaleY = this.getScale(index);
      args.object.scaleX = this.getScale(index);
      if (this.isFirstCard(index)) {
        this.getGestureHandler().attachToView(args.object);
      }
    }
  }

  cardTapped(card: ItemCard, index: number): void {
    console.log(card);
    console.log(index);
  }
}
