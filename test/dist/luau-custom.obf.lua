do
  local function lIllllI1IlIIIllIIlIlI1(IIIl11lIIIIl1I1lI11l1)
      error(IIIl11lIIIIl1I1lI11l1, 0)
    end
  local function I1IllllIlII1lII1111l1()
      local lI1I1III1I1llIIllIl1I = _ENV
      local l1II1I1l11lIIlI1II1 = rawget
      local II111I1III1lIlII11lIl = nil
      if l1II1I1l11lIIlI1II1 then
          II111I1III1lIlII11lIl = l1II1I1l11lIIlI1II1(lI1I1III1I1llIIllIl1I, "type")
        end
      if not II111I1III1lIlII11lIl then
          lIllllI1IlIIIllIIlIlI1("Integrity check failed")
        end
      if II111I1III1lIlII11lIl(lI1I1III1I1llIIllIl1I) ~= "table" then
          lIllllI1IlIIIllIIlIlI1("Integrity check failed")
        end
      if II111I1III1lIlII11lIl(l1II1I1l11lIIlI1II1) == "function" then
          local IIllIII11IllIll1IIIl1I = l1II1I1l11lIIlI1II1(lI1I1III1I1llIIllIl1I, "debug")
          if IIllIII11IllIll1IIIl1I and II111I1III1lIlII11lIl(IIllIII11IllIll1IIIl1I) == "table" then
              local l1IIlIl11l1Il1lllII1I = IIllIII11IllIll1IIIl1I.I1lII1I1lIIl111I1lII1
              if II111I1III1lIlII11lIl(l1IIlIl11l1Il1lllII1I) == "function" then
                  local II1lIllll1IIlllIllIll, l11I1lII1II1lIlIllllI = pcall(l1IIlIl11l1Il1lllII1I)
                  if II1lIllll1IIlllIllIll and l11I1lII1II1lIlIllllI ~= nil then
                      lIllllI1IlIIIllIIlIlI1("Integrity check failed")
                    end
                end
            end
        end
      local II1III1Il1Ill1I1IIl11 = getmetatable
      if II111I1III1lIlII11lIl(II1III1Il1Ill1I1IIl11) == "function" then
          local I1IlllIlllI11l1lllIII = II1III1Il1Ill1I1IIl11(lI1I1III1I1llIIllIl1I)
          if I1IlllIlllI11l1lllIII ~= nil then
              lIllllI1IlIIIllIIlIlI1("Integrity check failed")
            end
        end
    end
  I1IllllIlII1lII1111l1()
  local l1llIIl1IllI1lIll1II = false
  if l1llIIl1IllI1lIll1II then
      local lIlI1III1lI1l1Il1ll1I = setmetatable
      if typeFn(lIlI1III1lI1l1Il1ll1I) == "function" then
          local l1l1I1I1l11II1I1I1llI = _ENV
          local IIll1I1Illll1llII1l11I = getmetatable(l1l1I1I1l11II1I1I1llI)
          if IIll1I1Illll1llII1l11I == nil then
              IIll1I1Illll1llII1l11I = {}
              lIlI1III1lI1l1Il1ll1I(l1l1I1I1l11II1I1I1llI, IIll1I1Illll1llII1l11I)
            end
          if IIll1I1Illll1llII1l11I.IIIlIIl1II1l1I11IlI == nil then
              IIll1I1Illll1llII1l11I.IIIlIIl1II1l1I11IlI = "locked"
            end
          if IIll1I1Illll1llII1l11I.lI11l1llIlll1lII1 == nil then
              IIll1I1Illll1llII1l11I.lI11l1llIlll1lII1 = function()
  error("Runtime integrity violation", 0)
end
            end
        end
    end
end
local l1ll1l1lI11lIIIllII = {{87, 170, 94, 124}, {87, 177, 107, 109, 72, 37}, {100, 163, 96, 117}, {105, 176, 109, 107, 74, 28}}
local I11IllI1lll11IIIIlllI = {244, 66, 253, 10, 231, 177, 115, 86, 151, 31, 99, 255}
local lIlI1IIlI1l1I11lIII = {}
local function II1lIIlIIlIIlII1lI1I1(lIllIl1llllIl1I1l1lll1)
  local IIlI11II1II1IlI1I1l1ll = lIlI1IIlI1l1I11lIII[lIllIl1llllIl1I1l1lll1]
  if IIlI11II1II1IlI1I1l1ll ~= nil then
      return IIlI11II1II1IlI1I1l1ll
    end
  local lIIIIII1lllIl1I1III1l = l1ll1l1lI11lIIIllII[lIllIl1llllIl1I1l1lll1]
  local IIll1II11III1l1l1llI11 = {}
  local IIlll11l1l11lI1lI1Il11 = # I11IllI1lll11IIIIlllI
  for II1l1Ill111II1Illl1I = 1, # lIIIIII1lllIl1I1III1l do
      local IIl1lll1I1IlII1lII1ll1 = II1l1Ill111II1Illl1I - 1
      IIl1lll1I1IlII1lII1ll1 = IIl1lll1I1IlII1lII1ll1 % IIlll11l1l11lI1lI1Il11
      IIl1lll1I1IlII1lII1ll1 = IIl1lll1I1IlII1lII1ll1 + 1
      local I11I11lI1III1IllII1I1 = lIIIIII1lllIl1I1III1l[II1l1Ill111II1Illl1I] - I11IllI1lll11IIIIlllI[IIl1lll1I1IlII1lII1ll1]
      if I11I11lI1III1IllII1I1 < 0 then
          I11I11lI1III1IllII1I1 = I11I11lI1III1IllII1I1 + 256
        end
      IIll1II11III1l1l1llI11[II1l1Ill111II1Illl1I] = string.IIl1l1IIllIIlI1II1l(I11I11lI1III1IllII1I1)
    end
  local I11Illl1IIl11lIll11I = table.l1lllI1ll1II11lIl1I1I(IIll1II11III1l1l1llI11)
  lIlI1IIlI1l1I11lIII[lIllIl1llllIl1I1l1lll1] = I11Illl1IIl11lIll11I
  return I11Illl1IIl11lIll11I
end
local function IIll111I1l1l11IIlI1llI(IIlI1II1Il1lI1l11l1I1I, l1l1IlIIl11IIll1ll111)
  do
      local I1Il11Il1Ill1IIIIlI11 = 23
      local lI111llI11I11l1IIIIIl = 22
      local II1lIIll11IIl1IllIlll = 12
      local lIll11llIl11l111II111 = 28
      local I11111IIIllI11ll1Il1I = 17
      local l1IlI1lIllIlIIl1lll1I = 13
      local lIl111Il1111lIl1lIIl = 36
      local l111II1II1II1l1llII = 21
      local IIll11IlI1I11IlIIlIlI1 = 1
      local IIl1IIlIl111I11llIll = 39
      local IIlI11lIlIlllll11lIl1 = 11
      local lIlIlIIl11llIIll1l1l11 = 15
      local II1lI1II1I1I1IllI1l1 = 10
      local I11l11IlllI11IlI11l1 = 27
      local l11I1IIl1I1l111I1I1 = 20
      local l1111I1IlII11IlIllIIl = 31
      local IIIlI1l11lI1llIIIIlll = 29
      local I1I1I1lI1l1l1l111IIl1 = 26
      local IIllI1IlllIl111II1l1 = 38
      local I111lIIII1lIlIIlIIll1 = 30
      local IIIIIl1lII1lllll1lI = 18
      local l11I11lI1lI11ll1I1l = 24
      local III1I1l1I1l11IIll1ll = 35
      local lIIllII11llIl11lIl11I = 25
      local II1IlIl1IlllIIllI1ll1 = 8
      local l1Il11I1l1ll11IlIl1Il = 3
      local I11ll1lI1Il1lll1l1Il1 = 7
      local l11lI11lIIIl1I1IIll = 4
      local I1IlII11IIl1IIlIlllII = 37
      local lIII1I1l11llll1Ill1l1 = 2
      local I1II1lII1l11II11l1lIl = 40
      local l1I1III11Il1I111IlIlI = 33
      local I1lI1lI1lll1l1111lIl1 = 14
      local IIlIl11II11ll11IIll11l = 6
      local I1lIlIIIlIlIllI11llll = 32
      local l1IIl1Il1IIIl11l1IIl = 9
      local lI1I1lllI11l11111IIlI = 16
      local IIII1I11I11II11I1I11l = 5
      local lIlIl1lllIl111IIlIIll1 = 34
      local l111l11111II1III11II1 = 19
      local l1lllIIlI11llllI1II1 = {{{176, 189, 188}, {176, 190, 188}, {166, 188, 188}, {160, 191, 188}, {152, 188, 188}, {169, 188, 188}, {170, 189, 188}, {176, 191, 188}, {179, 188, 188}, {169, 188, 188}, {170, 190, 188}, {176, 189, 188}, {176, 190, 188}, {162, 188, 188}, {179, 188, 188}, {160, 184, 188}, {173, 191, 188}, {176, 184, 188}, {182, 189, 189}, {160, 185, 188}, {170, 184, 188}, {160, 186, 188}, {170, 184, 188}}, {{160, 187, 188}, {176, 185, 188}, {176, 186, 188}, {176, 187, 188}, {182, 190, 190}, {160, 181, 188}, {160, 180, 188}, {176, 180, 188}, {170, 184, 188}, {191, 188, 188}, {161, 151, 188}, {155, 188, 188}, {176, 180, 188}, {160, 187, 188}, {176, 191, 188}, {176, 181, 188}, {166, 188, 188}, {160, 191, 188}, {168, 165, 188}, {155, 188, 188}}, {{176, 191, 188}, {170, 185, 188}, {190, 188, 188}, {163, 138, 188}, {155, 188, 188}, {176, 184, 188}, {170, 190, 188}, {183, 188, 188}, {167, 189, 188}, {168, 139, 188}, {155, 188, 188}, {176, 191, 188}, {167, 189, 188}}, {{167, 188, 188}}}
      local I1lIlIllIlI1lIIlllIII = {1, 24, 44, 57}
      local l11Il1l1ll1II1lIIllll = {2, 3, 1, 4}
      local IIll11II1I1IlIl1IIIl = {}
      for lIlIlIlIllIl1l11l1llI = 1, # l11Il1l1ll1II1lIIllll do
          local I1IIlII1IlIl1Il1I1II1 = l11Il1l1ll1II1lIIllll[lIlIlIlIllIl1l11l1llI]
          local lI1IlI11lIlIllI1IIIl = l1lllIIlI11llllI1II1[I1IIlII1IlIl1Il1I1II1]
          local IIlllIII1l11lIl1I1ll1I = I1lIlIllIlI1lIIlllIII[I1IIlII1IlIl1Il1I1II1]
          for I1I1l1I1IIl11IlIIII = 1, # lI1IlI11lIlIllI1IIIl do
              IIll11II1I1IlIl1IIIl[IIlllIII1l11lIl1I1ll1I + I1I1l1I1IIl11IlIIII - 1] = lI1IlI11lIlIllI1IIIl[I1I1l1I1IIl11IlIIII]
            end
        end
      local l1llllIll111l1II111lI = {{4, {120, 21, 29}}, {4, {116, 7, 32}}, {4, {130, 7, 23, 69, 222}}, {0, {}}, {3, {67, 214}}}
      local lIl1lIll11lIllI11l111 = {18, 166, 174, 211, 107, 193, 194}
      local l1I1lIIIII11llIl1lIlI = {}
      local II11l11I1llIll1lI1111 = # lIl1lIll11lIllI11l111
      for lIll1I1IlIIIll1llll11l = 1, 5 do
          local III11I1ll1I1IIllll11l = l1llllIll111l1II111lI[lIll1I1IlIIIll1llll11l]
          local l1111Il1I1IIII111lllI = III11I1ll1I1IIllll11l[1]
          local IIIll1I1IllII1l11ll1 = III11I1ll1I1IIllll11l[2]
          local IIIlllI11l1111l1lllI = {}
          for I1IIIIIl1I11l1I1IIll = 1, # IIIll1I1IllII1l11ll1 do
              local I1lIlIII1IllI11l11lI = (I1IIIIIl1I11l1I1IIll - 1) % II11l11I1llIll1lI1111 + 1
              local IIllll1III1llIlIlIlIll = IIIll1I1IllII1l11ll1[I1IIIIIl1I11l1I1IIll] - lIl1lIll11lIllI11l111[I1lIlIII1IllI11l11lI]
              if IIllll1III1llIlIlIlIll < 0 then
                  IIllll1III1llIlIlIlIll = IIllll1III1llIlIlIlIll + 256
                end
              IIIlllI11l1111l1lllI[I1IIIIIl1I11l1I1IIll] = string[II1lIIlIIlIIlII1lI1I1(1)](IIllll1III1llIlIlIlIll)
            end
          local I11IlI11II1I11l1IlII = table[II1lIIlIIlIIlII1lI1I1(2)](IIIlllI11l1111l1lllI)
          if l1111Il1I1IIII111lllI == 0 then
              l1I1lIIIII11llIl1lIlI[lIll1I1IlIIIll1llll11l] = nil
      elseif l1111Il1I1IIII111lllI == 1 then
              l1I1lIIIII11llIl1lIlI[lIll1I1IlIIIll1llll11l] = false
      elseif l1111Il1I1IIII111lllI == 2 then
              l1I1lIIIII11llIl1lIlI[lIll1I1IlIIIll1llll11l] = true
      elseif l1111Il1I1IIII111lllI == 3 then
              l1I1lIIIII11llIl1lIlI[lIll1I1IlIIIll1llll11l] = tonumber(I11IlI11II1I11l1IlII)
            else
              l1I1lIIIII11llIl1lIlI[lIll1I1IlIIIll1llll11l] = I11IlI11II1I11l1IlII
            end
        end
      local lIl11l11l1Il1II111Il1 = ((125 + # IIll11II1I1IlIl1IIIl + 5) % 255) + 1
      local l1ll11lII1IlI111IIIII = {IIlI1II1Il1lI1l11l1I1I, l1l1IlIIl11IIll1ll111}
      local l1IIIllIIIIIII1l1Il11 = {}
      local I111l1ll1I1IIlIlI111I = 0
      local lIII11l1lIlI1I1ll1I1l = 1
      local I11IIlIl1I1l11Il11Il = _ENV
      local l1Il1Il11l1II1llIIIl = table[II1lIIlIIlIIlII1lI1I1(3)]
      local IIll1IIl11III11l1II1lI = table[II1lIIlIIlIIlII1lI1I1(4)]
      while true do
          local lIIllIlI11lI11lII1I1l = IIll11II1I1IlIl1IIIl[lIII11l1lIlI1I1ll1I1l]
          local I1l11IlII111lIlI1lll1 = lIIllIlI11lI11lII1I1l[1]
          local I1111IIIIl1lI1lIIlllI = lIIllIlI11lI11lII1I1l[2]
          local I11lIl1lIlIIll111Il1l = lIIllIlI11lI11lII1I1l[3]
          if lIl11l11l1Il1II111Il1 ~= 0 then
              I1l11IlII111lIlI1lll1 = I1l11IlII111lIlI1lll1 ~ lIl11l11l1Il1II111Il1
              I1111IIIIl1lI1lIIlllI = I1111IIIIl1lI1lIIlllI ~ lIl11l11l1Il1II111Il1
              I11lIl1lIlIIll111Il1l = I11lIl1lIlIIll111Il1l ~ lIl11l11l1Il1II111Il1
            end
          if I1l11IlII111lIlI1lll1 == I1Il11Il1Ill1IIIIlI11 then
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lI111llI11I11l1IIIIIl then
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = l1I1lIIIII11llIl1lIlI[I1111IIIIl1lI1lIIlllI]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == II1lIIll11IIl1IllIlll then
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = l1ll11lII1IlI111IIIII[I1111IIIIl1lI1lIIlllI]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIll11llIl11l111II111 then
              l1ll11lII1IlI111IIIII[I1111IIIIl1lI1lIIlllI] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I11111IIIllI11ll1Il1I then
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = I11IIlIl1I1l11Il11Il[l1I1lIIIII11llIl1lIlI[I1111IIIIl1lI1lIIlllI]]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l1IlI1lIllIlIIl1lll1I then
              I11IIlIl1I1l11Il11Il[l1I1lIIIII11llIl1lIlI[I1111IIIIl1lI1lIIlllI]] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIl111Il1111lIl1lIIl then
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = {}
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l111II1II1II1l1llII then
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIll11IlI1I11IlIIlIlI1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I], l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1], l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIl1IIlIl111I11llIll then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIlI11lIlIlllll11lIl1 then
              local IIII11Il1IlIlII1lII1I = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              local IIIIlIlI1l1I11I11IIll = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = IIIIlIlI1l1I11I11IIll[IIII11Il1IlIlII1lII1I]
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIlIlIIl11llIIll1l1l11 then
              local l1lIlll1l1Il1llIIIlI = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              local lIl1Il1IIIIlIIlI111lI = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = nil
              local l1I1IIIIlI1ll1Illllll = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 2]
              l1I1IIIIlI1ll1Illllll[lIl1Il1IIIIlIIlI111lI] = l1lIlll1l1Il1llIIIlI
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 2
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == II1lI1II1I1I1IllI1l1 then
              local lIIlIll1l1I1IIlII1Ill = I1111IIIIl1lI1lIIlllI
              local IIlll111lll1I11l1lIl1I = I11lIl1lIlIIll111Il1l
              local lIlIllIII1l11I1IlI1Ill = {}
              for I11Il1111IlI1l11lllI1 = lIIlIll1l1I1IIlII1Ill, 1, - 1 do
                  lIlIllIII1l11I1IlI1Ill[I11Il1111IlI1l11lllI1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
                  l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
                  I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
                end
              local lII1lI1l1IIllll1l1I1l = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              local lIl1l1l111l1II1Il1IIl = l1Il1Il11l1II1llIIIl(lII1lI1l1IIllll1l1I1l(IIll1IIl11III11l1II1lI(lIlIllIII1l11I1IlI1Ill, 1, lIIlIll1l1I1IIlII1Ill)))
              if IIlll111lll1I11l1lIl1I == 1 then
                  I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
                  l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = lIl1l1l111l1II1Il1IIl[1]
        elseif IIlll111lll1I11l1lIl1I > 1 then
                  for lIlI1Illl11II1Il1l1II1 = 1, IIlll111lll1I11l1lIl1I do
                      I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I + 1
                      l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = lIl1l1l111l1II1Il1IIl[lIlI1Illl11II1Il1l1II1]
                    end
                end
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I11l11IlllI11IlI11l1 then
              local l11I1I11II11IlI1IlIl1 = I1111IIIIl1lI1lIIlllI
              if l11I1I11II11IlI1IlIl1 == 0 then
                  return
        elseif l11I1I11II11IlI1IlIl1 == 1 then
                  return l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
                else
                  local lII1I1IlII11IlI1lllll = {}
                  for lI1lI1IllI11IllIllI1 = l11I1I11II11IlI1IlIl1, 1, - 1 do
                      lII1I1IlII11IlI1lllll[lI1lI1IllI11IllIllI1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
                      l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
                      I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
                    end
                  return IIll1IIl11III11l1II1lI(lII1I1IlII11IlI1lllll, 1, l11I1I11II11IlI1IlIl1)
                end
      elseif I1l11IlII111lIlI1lll1 == l11I1IIl1I1l111I1I1 then
              lIII11l1lIlI1I1ll1I1l = I1111IIIIl1lI1lIIlllI
      elseif I1l11IlII111lIlI1lll1 == l1111I1IlII11IlIllIIl then
              if not l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] then
                  lIII11l1lIlI1I1ll1I1l = I1111IIIIl1lI1lIIlllI
                else
                  lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
                end
      elseif I1l11IlII111lIlI1lll1 == IIIlI1l11lI1llIIIIlll then
              if l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] then
                  lIII11l1lIlI1I1ll1I1l = I1111IIIIl1lI1lIIlllI
                else
                  lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
                end
      elseif I1l11IlII111lIlI1lll1 == I1I1I1lI1l1l1l111IIl1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] + l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIllI1IlllIl111II1l1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] - l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I111lIIII1lIlIIlIIll1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] * l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIIIIl1lII1lllll1lI then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] / l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l11I11lI1lI11ll1I1l then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] // l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == III1I1l1I1l11IIll1ll then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] % l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIIllII11llIl11lIl11I then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] ^ l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == II1IlIl1IlllIIllI1ll1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] .. l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l1Il11I1l1ll11IlIl1Il then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] == l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I11ll1lI1Il1lll1l1Il1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] ~= l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l11lI11lIIIl1I1IIll then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] < l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I1IlII11IIl1IIlIlllII then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] <= l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIII1I1l11llll1Ill1l1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] > l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I1II1lII1l11II11l1lIl then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] >= l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l1I1III11Il1I111IlIlI then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] & l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I1lI1lI1lll1l1111lIl1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] | l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIlIl11II11ll11IIll11l then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] ~ l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == I1lIlIIIlIlIllI11llll then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] << l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l1IIl1Il1IIIl11l1IIl then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] = l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I - 1] >> l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = nil
              I111l1ll1I1IIlIlI111I = I111l1ll1I1IIlIlI111I - 1
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lI1I1lllI11l11111IIlI then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = - l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == IIII1I11I11II11I1I11l then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = not l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == lIlIl1lllIl111IIlIIll1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = # l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
      elseif I1l11IlII111lIlI1lll1 == l111l11111II1III11II1 then
              l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I] = ~ l1IIIllIIIIIII1l1Il11[I111l1ll1I1IIlIlI111I]
              lIII11l1lIlI1I1ll1I1l = lIII11l1lIlI1I1ll1I1l + 1
            else
              return
            end
        end
    end
end
print(IIll111I1l1l11IIlI1llI(2, 6))