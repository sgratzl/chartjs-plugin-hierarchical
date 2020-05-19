export interface ILabelNode {
  label: string;
  expand: boolean;
  level: number;

  center: number;
  width: number;
  hidden: boolean;
  major: boolean;
  toString(): string;

  children: ILabelNode[];
}

export declare type ILabelNodes = ReadonlyArray<ILabelNode>;

export interface IValueNode {}
