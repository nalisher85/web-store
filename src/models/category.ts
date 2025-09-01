export class Category {
  id: number
  name: string
  parent: Category | null = null
  children: Category[] = []

  constructor(id: number, name: string) {
    this.id = id
    this.name = name
  }

  addChild(child: Category) {
    child.parent = this
    this.children.push(child)
  }

  isRoot(): boolean {
    return this.id === 0
  }

  iterateUp(): Category[] {
    const result: Category[] = []
    let current: Category | null = this
    while (current) {
      result.unshift(current)
      current = current.parent
    }
    return result
  }

  iterateDown(): Category[] {
    const result: Category[] = [this]
    for (const child of this.children) {
      result.push(...child.iterateDown())
    }
    return result
  }

  static root = new Category(0, 'root')
}
