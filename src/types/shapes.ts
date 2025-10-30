export type ShapeType = 
  | "rectangle" 
  | "l-shape-tl" 
  | "l-shape-tr" 
  | "l-shape-bl" 
  | "l-shape-br" 
  | "triangle" 
  | "circle"
  | "slab";

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
}

export interface Rectangle extends BaseShape {
  type: "rectangle";
  width: number;
  height: number;
}

export interface LShape extends BaseShape {
  type: "l-shape-tl" | "l-shape-tr" | "l-shape-bl" | "l-shape-br";
  width: number;
  height: number;
  legWidth: number;
  legHeight: number;
}

export interface Triangle extends BaseShape {
  type: "triangle";
  base: number;
  height: number;
}

export interface Circle extends BaseShape {
  type: "circle";
  radius: number;
}

export interface Slab extends BaseShape {
  type: "slab";
  width: number;
  height: number;
}

export type Shape = Rectangle | LShape | Triangle | Circle | Slab;
