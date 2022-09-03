-- © 2022 Jean-François Pérusse
-- A Lua implementation for a JavaScript runtime

js = require "js"
context = js.global

CurrentTouch = {
    id = -1,
    state = ENDED,
    pos = {
        x = 0,
        y = 0
    }
}

context.luaSetWindowSize = function(_, w, h)
    WIDTH = w
    HEIGHT = h
end

context.luaSetTime = function(_, elapsedTime, deltaTime)
    ElapsedTime = elapsedTime
    DeltaTime = deltaTime
end

context.luaEval = function(_, text)
    load(text)()
end

context.luaCallSetup = function(_)
    local status, err = pcall(setup)
    if not status then
        context:handleError("Error in setup(): " .. err)
        error("Restart needed.")
    end

    local oldprint = print
    print = function(...)
        local args = {...}
        local result = ""
        for i, v in ipairs(args) do
            if i > 1 then
                result = result .. " "
            end
            result = result .. tostring(v)
        end
        context:handlePrint(result)
        oldprint(...)
    end
end

context.luaCallDraw = function(_)
    local status, err = pcall(draw)
    if not status then
        context:handleError("Error in draw(): " .. err)
        error("Restart needed.")
    end

    _keyboardLeftBegan = false
    _keyboardUpBegan = false
    _keyboardRightBegan = false
    _keyboardDownBegan = false
end

context.luaMouse = function(_, state, x, y)
    CurrentTouch.id = 0
    CurrentTouch.state = state
    CurrentTouch.pos.x = x
    CurrentTouch.pos.y = y
    
    touched({
        id = 1,
        state = state,
        pos = { x = x, y = y },
        x = x,
        y = y
    })
end

context.luaKeyDown = function(_, key)
    if js_keydown ~= nil then
        js_keydown(key)
    end
end

context.luaKeyUp = function(_, key)
    if js_keyup ~= nil then
        js_keyup(key)
    end
end

function readLocalData(key, defaultValue)
    return context:readLocalData(key, defaultValue)
end

function saveLocalData(key, value)
    return context:saveLocalData(key, value)
end

parameter = {}

parameter.integer = function(name, min, max, value)
    _G[name] = value
end

parameter.action = function(name, callback)

end

pasteboard = {}
pasteboard_mt = {}
pasteboard_mt.__index = function (t, k)
    warnOnce("reading pasteboard." .. k .. "is not supported")
end
pasteboard_mt.__newindex = function (t, k, v)
    if k == "text" then
        context:copyToClipboard(v)
        return
    end
    warnOnce("writing pasteboard." .. k .. "is not supported")
end
setmetatable(pasteboard, pasteboard_mt)

viewer = {}

empty_mt = {}
empty_mt.__index = function(t, k)
    local new_t = { key = t.key .. "." .. k }
    setmetatable(new_t, empty_mt)
    return new_t
end
empty_mt.__call = function(t, msg)
    if msg then
        warnOnce(msg)
    end
end

asset = { key = 'asset' }
setmetatable(asset, empty_mt)

objc = { key = 'objc' }
setmetatable(objc, empty_mt)

warnings = {}

function warnOnce(msg)
    if not warnings[msg] then
        warnings[msg] = true
        context.console:warn(msg)
    end
end

music_mt = {}
music_mt.__index = function (t, k)
    if k == "paused" then
        return context:isMusicPaused()
    end
    warnOnce("getting music." .. k .. "is not supported")
end
music_mt.__newindex = function (t, k, v)
    if k == "paused" then
        context:setMusicPaused(v)
        return
    end
    warnOnce("setting music." .. k .. "is not supported")
end
music_mt.__call = function(t, msg)
    if type(msg) == "table" then
        context:playMusicAsset(msg.key)
    else
        context:playMusicName(msg)
    end
end

music = {}
setmetatable(music, music_mt)

function sound(...)
    local arg = {...}

    if #arg == 2 then
        if arg[1] == "data" then
            context:playSoundData(arg[2])
        else
            warnOnce("unsupported sound " .. arg[1])
        end
    elseif #arg == 1 then
        if type(arg[1]) == "table" then
            context:playSoundAsset(arg[1].key)
        else
            context:playSoundName(arg[1])
        end
    else
        warnOnce("unsupported sound parameters " .. #arg)
    end
end

function font(...)
    local arg = {...}

    if #arg == 0 then
        return context.fontName
    else
        context.fontName = arg[1]
    end

    context:applyFont()
end

function fontSize(...)
    local arg = {...}

    if #arg == 0 then
        return context.fontSize
    else
        context.fontSize = arg[1]
    end

    context:applyFont()
end

function textMode(...)
    local arg = {...}

    if #arg == 0 then
        return context.textMode
    else
        context.textMode = arg[1]
    end
end

function textSize(text)
    local size = context:textSize(text)
    return size[1], size[2]
end

function rectMode(...)
    local arg = {...}

    if #arg == 0 then
        return context.rectMode
    else
        context.rectMode = arg[1]
    end
end

function ellipseMode(...)
    local arg = {...}

    if #arg == 0 then
        return context.ellipseMode
    else
        context.ellipseMode = arg[1]
    end
end

function spriteMode(...)
    local arg = {...}

    if #arg == 0 then
        return context.spriteMode
    else
        context.spriteMode = arg[1]
    end
end

function textAlign(...)
    local arg = {...}

    if #arg == 0 then
        return context.textAlign
    else
        context.textAlign = arg[1]
    end
end

function strokeWidth(...)
    local arg = {...}

    if #arg == 0 then
        return context.strokeWidth
    else
        context.strokeWidth = arg[1]
    end
end

function background(...)
    local arg = {...}

    if #arg == 0 then
        context:background(0, 0, 0, 255)
    elseif #arg == 1 then
        if type(arg[1]) == "table" then
            context:background(arg[1].r, arg[1].g, arg[1].b, arg[1].a)
        else
            context:background(arg[1], arg[1], arg[1], 255)
        end
    elseif #arg == 2 then
        context:background(arg[1], arg[1], arg[1], arg[2])
    elseif #arg == 3 then
        context:background(arg[1], arg[2], arg[3], 255)
    elseif #arg == 4 then
        context:background(arg[1], arg[2], arg[3], arg[4])
    end
end

function noTint()
    context.tint.r = 255
    context.tint.g = 255
    context.tint.b = 255
    context.tint.a = 255
end

function tint(...)
    local arg = {...}

    if #arg == 0 then
        return context.tint.r, context.tint.g, context.tint.b, context.tint.a
    elseif #arg == 1 then
        if type(arg[1]) == "table" then
            context.tint.r = arg[1].r
            context.tint.g = arg[1].g
            context.tint.b = arg[1].b
            context.tint.a = arg[1].a
        else
            context.tint.r = arg[1]
            context.tint.g = arg[1]
            context.tint.b = arg[1]
            context.tint.a = 255
        end
    elseif #arg == 2 then
        context.tint.r = arg[1]
        context.tint.g = arg[1]
        context.tint.b = arg[1]
        context.tint.a = arg[2]
    elseif #arg == 3 then
        context.tint.r = arg[1]
        context.tint.g = arg[2]
        context.tint.b = arg[3]
        context.tint.a = 255
    elseif #arg == 4 then
        context.tint.r = arg[1]
        context.tint.g = arg[2]
        context.tint.b = arg[3]
        context.tint.a = arg[4]
    end
end

function noFill()
    context.fill.a = 0
end

function fill(...)
    local arg = {...}

    if #arg == 0 then
        return context.fill.r, context.fill.g, context.fill.b, context.fill.a
    elseif #arg == 1 then
        if type(arg[1]) == "table" then
            context.fill.r = arg[1].r
            context.fill.g = arg[1].g
            context.fill.b = arg[1].b
            context.fill.a = arg[1].a
        else
            context.fill.r = arg[1]
            context.fill.g = arg[1]
            context.fill.b = arg[1]
            context.fill.a = 255
        end
    elseif #arg == 2 then
        context.fill.r = arg[1]
        context.fill.g = arg[1]
        context.fill.b = arg[1]
        context.fill.a = arg[2]
    elseif #arg == 3 then
        context.fill.r = arg[1]
        context.fill.g = arg[2]
        context.fill.b = arg[3]
        context.fill.a = 255
    elseif #arg == 4 then
        context.fill.r = arg[1]
        context.fill.g = arg[2]
        context.fill.b = arg[3]
        context.fill.a = arg[4]
    end
end

function noStroke()
    context.strokeWidth = 0
end

function stroke(...)
    local arg = {...}

    if #arg == 0 then
        return context.stroke.r, context.stroke.g, context.stroke.b, context.stroke, a
    elseif #arg == 1 then
        if type(arg[1]) == "table" then
            context.stroke.r = arg[1].r
            context.stroke.g = arg[1].g
            context.stroke.b = arg[1].b
            context.stroke.a = arg[1].a
        else
            context.stroke.r = arg[1]
            context.stroke.g = arg[1]
            context.stroke.b = arg[1]
            context.stroke.a = 255
        end
    elseif #arg == 2 then
        context.stroke.r = arg[1]
        context.stroke.g = arg[1]
        context.stroke.b = arg[1]
        context.stroke.a = arg[2]
    elseif #arg == 3 then
        context.stroke.r = arg[1]
        context.stroke.g = arg[2]
        context.stroke.b = arg[3]
        context.stroke.a = 255
    elseif #arg == 4 then
        context.stroke.r = arg[1]
        context.stroke.g = arg[2]
        context.stroke.b = arg[3]
        context.stroke.a = arg[4]
    end
end

function pushMatrix()
    context:pushMatrix()
end

function popMatrix()
    context:popMatrix()
end

function pushStyle()
    context:pushStyle()
end

function popStyle()
    context:popStyle()
end

function translate(...)
    local arg = {...}

    context:translate(arg[1], arg[2])
end

function scale(...)
    local arg = {...}

    local x = arg[1]
    local y = 1

    if #arg > 1 then
        y = arg[2]
    end

    context:scale(x, y)
end

function text(...)
    local arg = {...}

    local msg = arg[1]
    local x = 0
    local y = 0

    if #arg > 1 then
        x = arg[2]
    end
    
    if #arg > 2 then
        y = arg[3]
    end

    context:text(msg, x, y)
end

layout = {}
layout.safeArea = {}
layout.safeArea.left = 0
layout.safeArea.right = 0
layout.safeArea.top = 0
layout.safeArea.bottom = 0

function rect(...)
    local arg = {...}

    context:rect(arg[1], arg[2], arg[3], arg[4])
end

function ellipse(...)
    local arg = {...}

    context:ellipse(arg[1], arg[2], arg[3], arg[4])
end

function line(...)
    local arg = {...}

    context:line(arg[1], arg[2], arg[3], arg[4])
end

function sprite(...)
    local arg = {...}

    local key = ""

    if type(arg[1]) == "table" then
        key = arg[1].key
    else
        key = arg[1]
    end

    context:sprite(key, arg[2], arg[3], arg[4], arg[5])
end

function smooth()
    context:smooth()
end

function noSmooth()
    context:noSmooth()
end

function readImage(...)
    local arg = {...}

    local key = ""

    if type(arg[1]) == "table" then
        key = arg[1].key
    else
        key = arg[1]
    end

    return context:readImage(key)
end
