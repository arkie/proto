import SpriteKit

class Board: SKNode {
    let slideMinimum = 2
    let width = 10
    let height = 10
    var board = [Tile?](repeating: nil, count: 10 * 10) // width * height
    var touch: UITouch?
    var select: Select?

    required init?(coder _: NSCoder) {
        fatalError("This shouldn't be needed")
    }

    override init() {
        super.init()
        position = CGPoint(x: Tile.sideLength / 2, y: Tile.sideLength / 2)
        tick()
    }

    func get(x: Int, y: Int) -> Tile? {
        guard 0 <= x, x < width, 0 <= y, y < height else { return nil }
        return board[y * width + x]
    }

    func set(x: Int, y: Int, tile: Tile?) {
        guard 0 <= x, x < width, 0 <= y, y < height else { return }
        board[y * width + x] = tile
        if let tile = tile, !children.contains(tile) {
            addChild(tile)
        }
    }

    func tick() {
        isUserInteractionEnabled = false
        let fallDelay = fall()
        if fallDelay > 0 {
            run(SKAction.wait(forDuration: fallDelay), completion: tick)
            return
        }
        let clearDelay = clear()
        if clearDelay > 0 {
            run(SKAction.wait(forDuration: clearDelay), completion: tick)
            return
        }
        isUserInteractionEnabled = true
    }

    func fall() -> TimeInterval {
        var delay = 0.0
        for x in 0 ..< width {
            for y in 0 ..< height {
                guard get(x: x, y: y) == nil else { continue }
                if y == height - 1 {
                    let sprite = Tile(type: TileType.random, x: x, y: y + 1)
                    set(x: x, y: y, tile: sprite)
                    sprite.move(x: x, y: y)
                    delay = Tile.fallTime
                } else if let above = get(x: x, y: y + 1) {
                    set(x: x, y: y + 1, tile: nil)
                    set(x: x, y: y, tile: above)
                    above.move(x: x, y: y)
                    delay = Tile.fallTime
                }
            }
        }
        return delay
    }

    func clear() -> TimeInterval {
        var delay = 0.0
        var dead = Set<Tile>()
        for x in 0 ..< width {
            for y in 0 ..< height {
                guard let tile = get(x: x, y: y) else { continue }
                if let tile1 = get(x: x + 1, y: y),
                    let tile2 = get(x: x + 2, y: y),
                    tile.type == tile1.type && tile1.type == tile2.type {
                    delay = Tile.removeTime
                    dead.insert(tile)
                    dead.insert(tile1)
                    dead.insert(tile2)
                }
                guard y < height - 2 else { continue }
                if let tile1 = get(x: x, y: y + 1),
                    let tile2 = get(x: x, y: y + 2),
                    tile.type == tile1.type && tile1.type == tile2.type {
                    delay = Tile.removeTime
                    dead.insert(tile)
                    dead.insert(tile1)
                    dead.insert(tile2)
                }
            }
        }
        for tile in dead {
            set(x: tile.x, y: tile.y, tile: nil)
            tile.remove()
        }
        return delay
    }

    override func touchesBegan(_ touches: Set<UITouch>, with _: UIEvent?) {
        guard let touch = touches.first, atPoint(touch.location(in: self)) is Tile else { return }
        self.touch = touch
    }

    override func touchesMoved(_ touches: Set<UITouch>, with _: UIEvent?) {
        guard let touch = touch, touches.contains(touch) else { return }
        let from = touch.previousLocation(in: self)
        let to = touch.location(in: self)
        let dx = to.x - from.x
        let dy = to.y - from.y
        if select == nil {
            guard max(abs(dx), abs(dy)) > CGFloat(slideMinimum) else { return }
            guard let tile = atPoint(from) as? Tile else { return }
            select = Select(board: self, start: tile, direction: abs(dx) > abs(dy) ? .horizontal : .vertical)
            addChild(select!)
        }
        select!.move(x: dx, y: dy)
    }

    override func touchesEnded(_: Set<UITouch>, with _: UIEvent?) {
        guard let select = select else { return }
        select.drop()
        self.select = nil
        tick()
    }
}
