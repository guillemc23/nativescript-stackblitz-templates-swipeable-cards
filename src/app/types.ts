import { View } from '@nativescript/core/ui/core/view';

export enum Direction {
  Left,
  Right,
}

export enum GestureState {
  UNDETERMINED = 0,
  FAILED = 1,
  BEGAN = 2,
  CANCELLED = 3,
  ACTIVE = 4,
  END = 5,
}

export enum CardStatus {
  Back,
  Show,
  Discard,
}

export type ItemCard = {
  img: string;
  status: CardStatus;
  view: View;
};
