import { UndoCUDOpEnum } from "./undo-cud-op-enum";
import { UndoStateEnum } from "./undo-state-enum";

export class DrawingAction {
    entity: any;
    prevState: any;
    nextState: any;
    status: UndoStateEnum = UndoStateEnum.pending;
    cudOp: UndoCUDOpEnum;
    
    constructor(e: any, cudOp: UndoCUDOpEnum) { 
        this.entity = e;
        this.cudOp = cudOp;
        this.prevState = this.cloneState(e);
    }

    store(e: any): boolean {
        this.nextState = this.cloneState(e);
        this.status = UndoStateEnum.restored;
        // return false if the entity has no changes
        return this.prevState !== this.nextState;
    }

    undo(): void {
        this.switchState(UndoStateEnum.undone);
    }

    redo(): void {
        this.switchState(UndoStateEnum.restored);
    }

    private switchState(status: UndoStateEnum): void {
        const tmp = this.prevState;
        Object.assign(this.entity, this.prevState);
        this.prevState = this.nextState;
        this.nextState = tmp;
        this.status = status;
    }

    private cloneState(e: any): any {
        // here you need some kind of object cloning, for example :
        const result: any = {};
        const allPropertyNames = Object.getOwnPropertyNames(e);
        allPropertyNames.forEach(p => {
            result[p] = Object.getOwnPropertyDescriptor(e, p)?.value;
        });
        return result;
    }
}