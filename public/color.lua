-- © 2022 Jean-François Pérusse
-- Compatible with Lua 5.1 (not 5.0).

function color(...)
    local result = {}
    local arg = {...}
    
    if #arg == 0 then
        result.r = 0
        result.g = 0
        result.b = 0
        result.a = 255
    elseif #arg == 1 then
        result.r = arg[1]
        result.g = arg[1]
        result.b = arg[1]
        result.a = 255
    elseif #arg == 2 then
        result.r = arg[1]
        result.g = arg[1]
        result.b = arg[1]
        result.a = arg[2]
    elseif #arg == 3 then
        result.r = arg[1]
        result.g = arg[2]
        result.b = arg[3]
        result.a = 255
    elseif #arg == 4 then
        result.r = arg[1]
        result.g = arg[2]
        result.b = arg[3]
        result.a = arg[4]
    end
    
    mt = {}
    
    mt.__tostring = function(t)
        return "(" ..
        t.r .. ", " ..
        t.g .. ", " ..
        t.b .. ", " ..
        t.a .. ")"
    end
    
    mt.__index = function(t, k)
        if k == "x" then
            return t.r
        elseif k == "y" then
            return t.g
        elseif k == "z" then
            return t.b
        elseif k == "w" then
            return t.a
        end

        return nil
    end

    mt.__newindex = function(t, k, v)
        if k == "x" then
            t.r = v
        elseif k == "y" then
            t.g = v
        elseif k == "z" then
            t.b = v
        elseif k == "w" then
            t.a = v
        end
    end

    mt.__mul = function(t1, t2)
        local result = {}

        local n = 1
        local c = nil

        if type(t1) == "number" then
            n = t1
            c = t2
        elseif type(t2) == "number" then
            n = t2
            c = t1
        end

        if c == nil then
            return nil
        end

        result.r = c.r * n
        result.g = c.g * n
        result.b = c.b * n
        result.a = c.a * n

        return color(result.r, result.g, result.b, result.a)
    end    
    
    setmetatable(result, mt)
    
    return result
end
