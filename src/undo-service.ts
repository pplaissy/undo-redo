import { DrawingAction } from "./drawing-action";
import { UndoCUDOpEnum } from "./undo-cud-op-enum";
import { UndoStateEnum } from "./undo-state-enum";

export class UndoService {
    actions: DrawingAction[] = [];
    pending: DrawingAction[] = [];
    maxActions: number;
    createRequested?: (state: any) => void;
    deleteRequested?: (id: string) => void;

    constructor(maxActions: number) {
        this.maxActions = maxActions;
    }

    start(es: any[], cudOp: UndoCUDOpEnum = UndoCUDOpEnum.update): void {
        // store a temp array of entities current state
        es.forEach(e => {
            const newAction = new DrawingAction(e, cudOp);
            if (cudOp !== UndoCUDOpEnum.update) {
                // occurs when an entity is inserted or deleted
                // in this case, the action is immediately stored
                newAction.store(e);
                this.storeAction(newAction);
            } else {
                this.pending.push(newAction);
            }
        });
    }

    store(es: any[]): void {
        // store the entities new state
        es.forEach(e => {
            // entity should be found in temp array
            const a = this.pending.find(x=> x.entity.entityId === e.entityId);
            if (a) {
                // store the new entity state if entity has changes
                if (a.store(e)) {
                    this.storeAction(a);
                }
            }
        });
        // clear temp array
        this.pending = [];
    }

    abort(): void {
        // update abort, clear temp array
        this.pending = [];
    }

    clear(): void {
        this.pending = [];
        this.actions = [];
    }

    undoLast(ids?: string[]): void {
        const undoable = this.undoable(ids);
        // may be there is no more action to undo
        if (undoable.length === 0) return;
        const last = undoable[undoable.length - 1];
        switch (last.cudOp) {
            case UndoCUDOpEnum.create:
                if (this.deleteRequested) this.deleteRequested(last.entity.entityId);
                break;
                case UndoCUDOpEnum.delete:
                if (this.createRequested) this.createRequested(last.entity);
                break;
        }
        last.undo();
    }

    redoLast(ids?: string[]): void {
        const redoable = this.redoable(ids);
        // may be ther is no more action to redo
        if (redoable.length === 0) return;
        // undo is backward, redo is forward, so we take the first
        const first = redoable[0];
        switch (first.cudOp) {
            case UndoCUDOpEnum.create:
                if (this.createRequested) this.createRequested(first.entity);
                break;
                case UndoCUDOpEnum.delete:
                if (this.deleteRequested) this.deleteRequested(first.entity.entityId);
                break;
        }
        first.redo();
    }

    private storeAction(a: DrawingAction): void {
        // move pending action to effective action
        this.actions.push(a);
        // drop first action if reach maximum storage
        this.checkMax();
    }

    private redoable(ids?: string[]): DrawingAction[] {
        return this.able(UndoStateEnum.undone, ids);
    }

    private undoable(ids?: string[]): DrawingAction[] {
        return this.able(UndoStateEnum.restored, ids);
    }

    private able(status: UndoStateEnum, ids?: string[]): DrawingAction[] {
        if (ids && ids.length > 0) {
            return this.actions.filter(x=> ids.includes(x.entity.entityId) && x.status === status);
        }
        return this.actions.filter(x=> x.status === status);
    }

    private checkMax(): void {
        if (this.actions.length > this.maxActions) {
            this.actions = this.actions.slice(1);
        }
    }
}