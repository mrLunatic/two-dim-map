class Cell<TItem> {
    private readonly _value: TItem | undefined;

    readonly isEmpty: boolean;

    public get value(): TItem | undefined {
        if (this.isEmpty) {
            return undefined;
        }

        return this._value;
    }

    constructor(value?: TItem) {
        this.isEmpty = value === undefined;
        this._value = value;
    }
}

type Row<TItem> = Array<Cell<TItem>>;

export default class Table<TKeyA, TKeyB, TItem> {
    private readonly _items = Array<Row<TItem>>();
    private readonly _keysA = new Map<TKeyA, number>();
    private readonly _keysB = new Map<TKeyB, number>();

    /**
     * Set or create value by keys combination
     * @param keyA Key A
     * @param keyB Key B
     * @param item New value
     */
    set(keyA: TKeyA, keyB: TKeyB, item: TItem): void {
        const indexA = this.getIndex(this._keysA, keyA);
        const indexB = this.getIndex(this._keysB, keyB);

        if (indexA + 1 > this._items.length) {
            for (let i = this._items.length; i <= indexA; i++) {
                this._items[i] = new Array<Cell<TItem>>();
            }
        }
        if (indexB + 1 > this._items[indexA].length) {
            for (let i = this._items[indexA].length; i <= indexB; i++) {
                this._items[indexA][i] = new Cell();
            }
        }
        this._items[indexA][indexB] = new Cell(item);
    }

    /**
     * Check value specified
     * @param keyA Key A
     * @param keyB Key B
     * @returns true, if value specified
     */
    has(keyA: TKeyA, keyB: TKeyB): boolean {
        const indexA = this._keysA.get(keyA);
        const indexB = this._keysB.get(keyB);
        if (indexA === undefined || indexB === undefined) {
            return false;
        }

        const cell = this._items[indexA][indexB];
        if (cell === undefined) {
            return false;
        }
        return !cell.isEmpty;
    }

    /**
     * Get values by specified keys
     * @param keyA 
     * @param keyB 
     */
    get(keyA: TKeyA, keyB: TKeyB): TItem | undefined {
        if (keyA == undefined && keyB == undefined) {
            return undefined;
        }

        const indexA = this._keysA.get(keyA);
        const indexB = this._keysB.get(keyB);

        if (indexA == undefined || indexB == undefined) {
            return undefined;
        }
        const cell = this._items[indexA][indexB];
        return cell.isEmpty ? undefined : cell.value;
    }

    /**
     * Get values by specified keys
     * @param keyA 
     * @param keyB 
     */
    getAll(keysA?: TKeyA|TKeyA[], keysB?: TKeyB|TKeyB[]): TItem | undefined | Array<TItem> {
        const iA = this.getIndexes(this._keysA, keysA);
        const iB = this.getIndexes(this._keysB, keysB);
        const items = new Array<TItem>();
        for (const a of iA) {
            for (const b of iB) {
                const item = this._items[a][b]
                if (item && !item.isEmpty) {
                    items.push(item.value!);
                }
            }
        }

        return items;
    }

    delete(keyA?: TKeyA, keyB?: TKeyB): void {
        const aToDelete = new Array<TKeyA>();
        const bToDelete = new Array<TKeyB>();

        const indexA = keyA != undefined ? this._keysA.get(keyA) : undefined;
        const indexB = keyB != undefined ? this._keysB.get(keyB) : undefined;

        if (indexA != undefined && indexB != undefined) {
            this._items[indexA][indexB] = new Cell();

            if (this._items[indexA].every((cell) => cell.isEmpty)) {
                aToDelete.push(keyA!);
            }
            if (this._items.every((row) => row[indexB].isEmpty)) {
                bToDelete.push(keyB!);
            }
        }
        else if (indexA != undefined) {
            aToDelete.push(keyA!);
        }
        else if (indexB != undefined) {
            bToDelete.push(keyB!);
        }

        for (const key of aToDelete) {
            const index = this.deleteIndex(this._keysA, key);
            this._items.splice(index, 1);
        }
        for (const key of bToDelete) {
            const index = this.deleteIndex(this._keysB, key);
            this._items.forEach((row) => row.splice(index, 1));
        }
    }

    items(): Array<{a: TKeyA, b: TKeyB, item: TItem}> {
        const items = new Array<{a: TKeyA, b: TKeyB, item: TItem}>();
        for (const a of this._keysA) {
            for(const b of this._keysB) {
                const item = this._items[a[1]][b[1]];
                if (item && !item.isEmpty) {
                    items.push({a: a[0], b:b[0], item: item.value!})
                }
            }
        }
        return items;
    }
    private deleteIndex<TKey>(keys: Map<TKey, number>, key: TKey): number {
        const index = keys.get(key)!;
        keys.delete(key);

        Array.from(keys.entries())
            .filter((v) => v[1] > index)
            .forEach((v) => {
                keys.set(v[0], v[1] - 1);
        });

        return index;
    }
    private getIndex<TKey>(existing: Map<TKey, number>, key: TKey): number {
        let index = existing.get(key);
        if (index != undefined) {
            return index;
        }
        index = 0;
        const indexes = Array.from(existing.values()).sort((a, b) => a - b);
        for (let i = 0; i < indexes.length; i++) {
            const current = indexes[i];
            if (i < current) {
                index = i;
                break;
            }
            const next = indexes[i + 1];
            if (next == undefined || next - current > 1) {
                index = current + 1;
                break;
            }
        }

        existing.set(key, index);
        return index;
    }

    private getIndexes<TKey>(existing: Map<TKey, number>, keys: TKey|TKey[]|undefined): Array<number> {
        if (keys == undefined) {
            return Array.from(existing.values());
        }
        if (keys instanceof Array) {
            return keys
            .filter((key) => existing.has(key))
            .map((key) => existing.get(key)!);
        }

        const indexes = new Array<number>();
        const index = existing.get(keys);
        if (index != undefined) {
            indexes.push(index);
        }
        return indexes;
    }
}