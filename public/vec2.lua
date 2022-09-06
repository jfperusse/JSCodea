-- © 2022 Jean-François Pérusse

function vec2(...)
    local result = {}
    local arg = {...}

    result[1] = arg[1]
    result[2] = arg[2]
    
    mt = {}
    
    mt.__tostring = function(t)
        return "(" ..
        t[1] .. ", " ..
        t[2] .. ")"
    end
    
    mt.__index = function(t, k)
        if k == "x" then
            return t[1]
        elseif k == "y" then
            return t[2]
        end

        return nil
    end

    mt.__newindex = function(t, k, v)
        if k == "x" then
            t[1] = v
        elseif k == "y" then
            t[2] = v
        end
    end

    mt.__add = function(t1, t2)
        local result = {}
        
        result[1] = t1[1] + t2[1]
        result[2] = t1[2] + t2[2]

        return vec2(result[1], result[2])
    end

    mt.__mul = function(t1, t2)
        local result = {}

        local n = 1
        local v = nil

        if type(t1) == "number" then
            n = t1
            v = t2
        elseif type(t2) == "number" then
            n = t2
            v = t1
        end

        if v == nil then
            return nil
        end

        result[1] = v[1] * n
        result[2] = v[2] * n

        return vec2(result[1], result[2])
    end

    mt.__div = function(t, n)
        if (type(t) ~= "table" or type(n) ~= "number") then
            return nil
        end

        local result = {}

        result[1] = v[1] / n
        result[2] = v[2] / n

        return vec2(result[1], result[2])
    end

    mt.__idiv = function(t, n)
        if (type(t) ~= "table" or type(n) ~= "number") then
            return nil
        end

        local result = {}

        result[1] = math.floor(v[1] / n)
        result[2] = math.floor(v[2] / n)

        return vec2(result[1], result[2])
    end

    mt.__sub = function(t1, t2)
        local result = {}
        
        result[1] = t1[1] - t2[1]
        result[2] = t1[2] - t2[2]

        return vec2(result[1], result[2])
    end

    mt.__unm = function(t)
        local result = {}
        
        result[1] = -t[1]
        result[2] = -t[2]

        return vec2(result[1], result[2])
    end

    mt.__eq = function(t1, t2)
        return t1[1] == t2[1] and t1[2] == t2[2]
    end

    result.len = function(t)
        return math.sqrt((t[1] * t[1]) + (t[2] * t[2]))
    end

    result.lenSqr = function(t)
        return (t[1] * t[1]) + (t[2] * t[2])
    end

    result.normalize = function(t)
        local result = {}

        local len = math.sqrt((t[1] * t[1]) + (t[2] * t[2]))

        result[1] = t[1] / len
        result[2] = t[2] / len

        return vec2(result[1], result[2])
    end

    setmetatable(result, mt)
    
    return result
end
