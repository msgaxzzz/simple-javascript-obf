do
  local function IIlllI1l1Illll1l1l1II(l11111I11111lI11IlllI)
      error(l11111I11111lI11IlllI, 0)
    end
  local l1Ill1IllI11IIIIllI11 = type
  if l1Ill1IllI11IIIIllI11 == nil then
      IIlllI1l1Illll1l1l1II("Integrity check failed")
    end
  local function I1111I11lIlIll1I1Il11()
      local IIllll1l1lIlI1IlllIll1
      local I1IlIl1IlllIllIIIlI = getfenv
      if l1Ill1IllI11IIIIllI11(I1IlIl1IlllIllIIIlI) == "function" then
          IIllll1l1lIlI1IlllIll1 = I1IlIl1IlllIllIIIlI(1)
        end
      if l1Ill1IllI11IIIIllI11(IIllll1l1lIlI1IlllIll1) ~= "table" then
          IIllll1l1lIlI1IlllIll1 = _G
        end
      local I11IIll1I1IIlIIlI1ll1 = getmetatable
      if l1Ill1IllI11IIIIllI11(I11IIll1I1IIlIIlI1ll1) == "function" then
          local IIllIIlll1lI11Il1IlllI = I11IIll1I1IIlIIlI1ll1(IIllll1l1lIlI1IlllIll1)
          if IIllIIlll1lI11Il1IlllI ~= nil then
              local l11I1llIl1I11111Ill = _G
              if l1Ill1IllI11IIIIllI11(l11I1llIl1I11111Ill) == "table" then
                  IIllll1l1lIlI1IlllIll1 = l11I1llIl1I11111Ill
                end
            end
        end
      return IIllll1l1lIlI1IlllIll1
    end
  local function IIlI111IIlIll1lII11lI()
      local lI11I11ll111llllIll1l = I1111I11lIlIll1I1Il11()
      if l1Ill1IllI11IIIIllI11(lI11I11ll111llllIll1l) ~= "table" then
          IIlllI1l1Illll1l1l1II("Integrity check failed")
        end
      local lIll1I1I11I1IIll1IlIl1 = debug
      if l1Ill1IllI11IIIIllI11(lIll1I1I11I1IIll1IlIl1) == "table" then
          local IIIIl11IlIlllIll11I1I = lIll1I1I11I1IIll1IlIl1.lII1lI11IIllIII1I11l1
          if l1Ill1IllI11IIIIllI11(IIIIl11IlIlllIll11I1I) == "function" then
              local IIIlll11I1lIl111lII1, IIIlI1llIlIII11l1ll1l = pcall(IIIIl11IlIlllIll11I1I)
              if IIIlll11I1lIl111lII1 and IIIlI1llIlIII11l1ll1l ~= nil then
                  IIlllI1l1Illll1l1l1II("Integrity check failed")
                end
            end
        end
      local lIIllI11IlIIIIIIll11l = getmetatable
      if l1Ill1IllI11IIIIllI11(lIIllI11IlIIIIIIll11l) == "function" then
          local lIl1l111l1I1IIl1ll1lI = lIIllI11IlIIIIIIll11l(lI11I11ll111llllIll1l)
          if lIl1l111l1I1IIl1ll1lI ~= nil then
              IIlllI1l1Illll1l1l1II("Integrity check failed")
            end
        end
    end
  IIlI111IIlIll1lII11lI()
  local I111Il111lll11IIll1l1 = false
  if I111Il111lll11IIll1l1 then
      local l1lII1Il111111IIl1Il = setmetatable
      if l1Ill1IllI11IIIIllI11(l1lII1Il111111IIl1Il) == "function" then
          local lIllI1l11III1lII1lIlII = I1111I11lIlIll1I1Il11()
          local II11lIllI11l1IlIlII11 = getmetatable(lIllI1l11III1lII1lIlII)
          if II11lIllI11l1IlIlII11 == nil then
              II11lIllI11l1IlIlII11 = {}
              l1lII1Il111111IIl1Il(lIllI1l11III1lII1lIlII, II11lIllI11l1IlIlII11)
            end
          if II11lIllI11l1IlIlII11.IIlIIl11IIIIIIll1l1I1l == nil then
              II11lIllI11l1IlIlII11.IIlIIl11IIIIIIll1l1I1l = "locked"
            end
          if II11lIllI11l1IlIlII11.lIIIllIlll1lIIIlII1Il == nil then
              II11lIllI11l1IlIlII11.lIIIllIlll1lIIIlII1Il = function()
  error("Runtime integrity violation", 0)
end
            end
        end
    end
end
local IIl1II1Il1l11l1llIl1I = {"\170\103\201\235\132\083\160\076", "\184\083\189\244\117", "\167\090\188\250", "\183\102\205\241\126\081", "\171\087\207\238\117\088\167", "\184\107\203\237", "\167\097\201\235\113\094", "\170\094\202\247\130", "\177\083\207\240", "\166\106\202\250", "\166\083\201\236", "\166\097\205", "\166\096\202\252", "\176\101\195\241\118\094", "\182\101\195\241\118\094", "\007\131\139\185", "\007\127\125\188", "\007\141\125\179\028\081", "", "\006\142\030\057", "\166\107\207\237", "\184\097\201\253\125\076\150\080", "\180\083\190\243", "\185\096\203\233\115\085", "\180\100\196\246\132"}
local IIII11lIIll1I1l1IIII1 = {68, 242, 91, 136, 16, 234, 49, 222, 126, 153, 41}
local lIIl1llIIlI1lllll1l1l = string.byte
local I11lI1IlIIl1IlIll11I = {}
local function l11lIllIllllIl1I1lI1I(lIlIlll1l111I111lI1Ill)
  local I1lI1lIlII1ll1lIIIlI1 = 298
  I1lI1lIlII1ll1lIIIlI1 = 298
  if 1 == 0 then
      local IIllII1llIlI11IllI11lI
    end
  do
      I1lI1lIlII1ll1lIIIlI1 = I1lI1lIlII1ll1lIIIlI1
    end
  local lI1IllIl1IIl1lIIllIl = I11lI1IlIIl1IlIll11I[lIlIlll1l111I111lI1Ill]
  if lI1IllIl1IIl1lIIllIl ~= nil then
      return lI1IllIl1IIl1lIIllIl
    end
  local IIlIIl11I111IlllIIl1I1 = IIl1II1Il1l11l1llIl1I[lIlIlll1l111I111lI1Ill]
  local II1llllll1I1IlllllI11 = {}
  local lII1l11lIllII11lI11I = #IIII11lIIll1I1l1IIII1
  for l1IIlI1lIII11111lIII1 = 1, #IIlIIl11I111IlllIIl1I1 do
      local I1I11l11I1ll11lI1IIl1 = l1IIlI1lIII11111lIII1 - 1
      I1I11l11I1ll11lI1IIl1 = I1I11l11I1ll11lI1IIl1 % lII1l11lIllII11lI11I
      I1I11l11I1ll11lI1IIl1 = I1I11l11I1ll11lI1IIl1 + 1
      local I1II111lIl1I11IIl11I = lIIl1llIIlI1lllll1l1l(IIlIIl11I111IlllIIl1I1, l1IIlI1lIII11111lIII1) - IIII11lIIll1I1l1IIII1[I1I11l11I1ll11lI1IIl1]
      if I1II111lIl1I11IIl11I < 0 then
          I1II111lIl1I11IIl11I = I1II111lIl1I11IIl11I + 256
        end
      II1llllll1I1IlllllI11[l1IIlI1lIII11111lIII1] = string.char(I1II111lIl1I11IIl11I)
    end
  local l1lll111IlIlllI1l1l1l = table.concat(II1llllll1I1IlllllI11)
  I11lI1IlIIl1IlIll11I[lIlIlll1l111I111lI1Ill] = l1lll111IlIlllI1l1l1l
  return l1lll111IlIlllI1l1l1l
end
local I1I1lII1IlllllI1II11 = nil
local lI1IIIllllI1I1IIIII11 = getfenv
if type(lI1IIIllllI1I1IIIII11) == l11lIllIllllIl1I1lI1I(1) then
  I1I1lII1IlllllI1II11 = lI1IIIllllI1I1IIIII11(1)
end
if type(I1I1lII1IlllllI1II11) ~= l11lIllIllllIl1I1lI1I(2) then
  I1I1lII1IlllllI1II11 = _G
end
local function IIlIllllll1lI1I1l1lI(II1I11IIl1I1lIII1IIll, I1I1III1lIIlIlIlllIl1)
  do
      local lIlIlIlI11Il1III1llII = 4294967296
      local lIIlIl1IIIIl1lI1Il1lI
      do
          local IIllIllI1lIIIllIlII1I1 = 57
          local lI1Illl1IlIll1I1I111 = {41, 48, 59, 250, 249}
          local IIll1lll1llIlI11II1II = {}
          for l1llIllIlII1llIlI1III = 1, #lI1Illl1IlIll1I1I111 do
              IIll1lll1llIlI11II1II[l1llIllIlII1llIlI1III] = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)]((lI1Illl1IlIll1I1I111[l1llIllIlII1llIlI1III] + IIllIllI1lIIIllIlII1I1) % 256)
            end
          local l1l1llIllII111l1lI
          local l11IlII111lll1ll1I11 = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(5)]
          if I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(6)](l11IlII111lll1ll1I11) == l11lIllIllllIl1I1lI1I(1) then
              l1l1llIllII111l1lI = l11IlII111lll1ll1I11(1)
            end
          if I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(6)](l1l1llIllII111l1lI) ~= l11lIllIllllIl1I1lI1I(2) then
              l1l1llIllII111l1lI = _G
            end
          lIIlIl1IIIIl1lI1Il1lI = l1l1llIllII111l1lI[I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(2)][l11lIllIllllIl1I1lI1I(7)](IIll1lll1llIlI11II1II)]
        end
      if lIIlIl1IIIIl1lI1Il1lI == nil then
          local function IIlIIIllIllllI1lI11II1(lIllllIIl11l1IIII1lll)
              lIllllIIl11l1IIII1lll = lIllllIIl11l1IIII1lll % lIlIlIlI11Il1III1llII
              if lIllllIIl11l1IIII1lll < 0 then
                  lIllllIIl11l1IIII1lll = lIllllIIl11l1IIII1lll + lIlIlIlI11Il1III1llII
                end
              return lIllllIIl11l1IIII1lll
            end
          lIIlIl1IIIIl1lI1Il1lI = {}
          function lIIlIl1IIIIl1lI1Il1lI.II1l11II1llI1111l11lI(IIll1lIll111I11ll1I1I, lIllII1l1IlIl11l1IlIIl)
              IIll1lIll111I11ll1I1I = IIlIIIllIllllI1lI11II1(IIll1lIll111I11ll1I1I)
              lIllII1l1IlIl11l1IlIIl = IIlIIIllIllllI1lI11II1(lIllII1l1IlIl11l1IlIIl)
              local IIIII1IlllI1111IIl11l = 0
              local I1Il1lllIIIl1llI1I1Il = 1
              for IIll1Il11lll1I11lIIllI = 0, 31 do
                  local lIIIllI1IlIl11II1lII = IIll1lIll111I11ll1I1I % 2
                  local l1l11lIl1IIIll1IIIlII = lIllII1l1IlIl11l1IlIIl % 2
                  if lIIIllI1IlIl11II1lII == 1 and l1l11lIl1IIIll1IIIlII == 1 then
                      IIIII1IlllI1111IIl11l = IIIII1IlllI1111IIl11l + I1Il1lllIIIl1llI1I1Il
                    end
                  IIll1lIll111I11ll1I1I = (IIll1lIll111I11ll1I1I - lIIIllI1IlIl11II1lII) / 2
                  lIllII1l1IlIl11l1IlIIl = (lIllII1l1IlIl11l1IlIIl - l1l11lIl1IIIll1IIIlII) / 2
                  I1Il1lllIIIl1llI1I1Il = I1Il1lllIIIl1llI1I1Il * 2
                end
              return IIIII1IlllI1111IIl11l
            end
          function lIIlIl1IIIIl1lI1Il1lI.lIl1I1IIl11lllIll1Il1(IIl1lll11III11l1Il1l1I, lIllll1lI11IIl1ll1llI1)
              IIl1lll11III11l1Il1l1I = IIlIIIllIllllI1lI11II1(IIl1lll11III11l1Il1l1I)
              lIllll1lI11IIl1ll1llI1 = IIlIIIllIllllI1lI11II1(lIllll1lI11IIl1ll1llI1)
              local I1I11llII1l111llIl1Il = 0
              local I1llIIllIl1l11llII1ll = 1
              for lI11lllll1llI11Il111 = 0, 31 do
                  local II11llI1I111lIIlIIII1 = IIl1lll11III11l1Il1l1I % 2
                  local IIIlllIlII1l1lII1ll1l = lIllll1lI11IIl1ll1llI1 % 2
                  if II11llI1I111lIIlIIII1 == 1 or IIIlllIlII1l1lII1ll1l == 1 then
                      I1I11llII1l111llIl1Il = I1I11llII1l111llIl1Il + I1llIIllIl1l11llII1ll
                    end
                  IIl1lll11III11l1Il1l1I = (IIl1lll11III11l1Il1l1I - II11llI1I111lIIlIIII1) / 2
                  lIllll1lI11IIl1ll1llI1 = (lIllll1lI11IIl1ll1llI1 - IIIlllIlII1l1lII1ll1l) / 2
                  I1llIIllIl1l11llII1ll = I1llIIllIl1l11llII1ll * 2
                end
              return I1I11llII1l111llIl1Il
            end
          function lIIlIl1IIIIl1lI1Il1lI.I11l11lllIlII1I1I1Ill(lIllllI1I1lIIIll11I1ll, lIlIIIl1lIl1IIll1lI)
              lIllllI1I1lIIIll11I1ll = IIlIIIllIllllI1lI11II1(lIllllI1I1lIIIll11I1ll)
              lIlIIIl1lIl1IIll1lI = IIlIIIllIllllI1lI11II1(lIlIIIl1lIl1IIll1lI)
              local I11lll1I1lI111I1lI1 = 0
              local I11I1IlllI1I1I1ll1I1I = 1
              for l1l1lllI11lI1IlI1II1 = 0, 31 do
                  local I1llI11lIlI11IlIll11 = lIllllI1I1lIIIll11I1ll % 2
                  local III1IIl11lI1IlI1lIII = lIlIIIl1lIl1IIll1lI % 2
                  if I1llI11lIlI11IlIll11 + III1IIl11lI1IlI1lIII == 1 then
                      I11lll1I1lI111I1lI1 = I11lll1I1lI111I1lI1 + I11I1IlllI1I1I1ll1I1I
                    end
                  lIllllI1I1lIIIll11I1ll = (lIllllI1I1lIIIll11I1ll - I1llI11lIlI11IlIll11) / 2
                  lIlIIIl1lIl1IIll1lI = (lIlIIIl1lIl1IIll1lI - III1IIl11lI1IlI1lIII) / 2
                  I11I1IlllI1I1I1ll1I1I = I11I1IlllI1I1I1ll1I1I * 2
                end
              return I11lll1I1lI111I1lI1
            end
          function lIIlIl1IIIIl1lI1Il1lI.II111I11lllll1I1l1II1(lI1lII111llIl1lI1IIl)
              local I1111111IIIlIIlI111I1 = 505
              I1111111IIIlIIlI111I1 = 505
              if 1 == 0 then
                  local l11Ill1IIl1IIl1l11I1
                end
              do
                  I1111111IIIlIIlI111I1 = I1111111IIIlIIlI111I1
                end
              return lIlIlIlI11Il1III1llII - 1 - IIlIIIllIllllI1lI11II1(lI1lII111llIl1lI1IIl)
            end
          function lIIlIl1IIIIl1lI1Il1lI.III11IlIlIIlIIIIIl1l(lIII1lIllIl1lI1l1I, I1I1IllI11IlII111111l)
              I1I1IllI11IlII111111l = I1I1IllI11IlII111111l % 32
              return (IIlIIIllIllllI1lI11II1(lIII1lIllIl1lI1l1I) * (2 ^ I1I1IllI11IlII111111l)) % lIlIlIlI11Il1III1llII
            end
          function lIIlIl1IIIIl1lI1Il1lI.IIIlllII1I1III1111IlI(l1lI1l1l11IIll11ll111, I1IIlIIIIll111IIll1)
              I1IIlIIIIll111IIll1 = I1IIlIIIIll111IIll1 % 32
              return I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(9)][l11lIllIllllIl1I1lI1I(8)](IIlIIIllIllllI1lI11II1(l1lI1l1l11IIll11ll111) / (2 ^ I1IIlIIIIll111IIll1))
            end
        end
      local function lIlIl1l1l1l11lIl1ll11(I1I1l1llll1l1lIll1Il1, lIIlIIIl11lI1III11III)
          return {I1I1l1llll1l1lIll1Il1, lIIlIIIl11lI1III11III}
        end
      local function l11IlIll1l1IIIIlII1ll(lI1lIII1III11Il11lII)
          return {0, lI1lIII1III11Il11lII % lIlIlIlI11Il1III1llII}
        end
      local function lIIllIIlII1l11I1l1l11(I1l111II1ll1I1ll1lllI)
          return I1l111II1ll1I1ll1lllI[2]
        end
      local function IIl11lIlI11Il1l11I1lI(IIl1llIIlI1II1lIII1I, I1llIlIl1llIllIIlll1I)
          local III1IIl11II1III1IIlll = IIl1llIIlI1II1lIII1I[2] + I1llIlIl1llIllIIlll1I[2]
          local lI11l1Il1lIlI11lll1II = 0
          if III1IIl11II1III1IIlll >= lIlIlIlI11Il1III1llII then
              III1IIl11II1III1IIlll = III1IIl11II1III1IIlll - lIlIlIlI11Il1III1llII
              lI11l1Il1lIlI11lll1II = 1
            end
          local lI11llI1llI1IIlIlI1ll = (IIl1llIIlI1II1lIII1I[1] + I1llIlIl1llIllIIlll1I[1] + lI11l1Il1lIlI11lll1II) % lIlIlIlI11Il1III1llII
          return {lI11llI1llI1IIlIlI1ll, III1IIl11II1III1IIlll}
        end
      local function l111lIl11Ill1IllI11I(II111II1l111lllll11Il, IIl1l1Il1IIllIIlIlIl)
          return ((II111II1l111lllll11Il[1] % IIl1l1Il1IIllIIlIlIl) * (lIlIlIlI11Il1III1llII % IIl1l1Il1IIllIIlIlIl) + (II111II1l111lllll11Il[2] % IIl1l1Il1IIllIIlIlIl)) % IIl1l1Il1IIllIIlIlIl
        end
      local function lI1l1II1lI1lII11lII1I(IIllllI1I1I11l1IlI1lI)
          return ((IIllllI1I1I11l1IlI1lI[1] % 255) * 1 + (IIllllI1I1I11l1IlI1lI[2] % 255)) % 255
        end
      local function II11l1ll1lll1111l1111(lIIII1I1IlII1Il1l1I1I, I11I111lll1ll1I1l11l)
          return {lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(10)](lIIII1I1IlII1Il1l1I1I[1], I11I111lll1ll1I1l11l[1]), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(10)](lIIII1I1IlII1Il1l1I1I[2], I11I111lll1ll1I1l11l[2])}
        end
      local function lIlI1IllllI1I11ll111ll(I1l1lll1ll111II11IIl1, II1lll111l1IIl1lII)
          return {lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(11)](I1l1lll1ll111II11IIl1[1], II1lll111l1IIl1lII[1]), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(11)](I1l1lll1ll111II11IIl1[2], II1lll111l1IIl1lII[2])}
        end
      local function lIlIIlIl1l1I1lI11I11II(I11IllI1II1l11l1IIIl, I111lII1llI11IllI11)
          return {lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(12)](I11IllI1II1l11l1IIIl[1], I111lII1llI11IllI11[1]), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(12)](I11IllI1II1l11l1IIIl[2], I111lII1llI11IllI11[2])}
        end
      local function I1Il1ll1I1l111lI1I1I1(lIlII11lIllIIIll1llll1)
          return {lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(13)](lIlII11lIllIIIll1llll1[1]), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(13)](lIlII11lIllIIIll1llll1[2])}
        end
      local function I1I1llllIIIl1l1l111ll(lIIlII11I11I1II1l11lI, lI1lI1lIll111lII11l1I)
          lI1lI1lIll111lII11l1I = lI1lI1lIll111lII11l1I % 64
          if lI1lI1lIll111lII11l1I == 0 then
              return {lIIlII11I11I1II1l11lI[1], lIIlII11I11I1II1l11lI[2]}
            end
          if lI1lI1lIll111lII11l1I >= 32 then
              local lIlll1IlI1IIll1I1l1IIl = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(14)](lIIlII11I11I1II1l11lI[2], lI1lI1lIll111lII11l1I - 32)
              return {lIlll1IlI1IIll1I1l1IIl, 0}
            end
          local I1l1IlI11ll1llll1lII = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(12)](lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(14)](lIIlII11I11I1II1l11lI[1], lI1lI1lIll111lII11l1I), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(15)](lIIlII11I11I1II1l11lI[2], 32 - lI1lI1lIll111lII11l1I))
          local lIllIlI1lIIIllIIlIlIIl = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(14)](lIIlII11I11I1II1l11lI[2], lI1lI1lIll111lII11l1I)
          return {I1l1IlI11ll1llll1lII, lIllIlI1lIIIllIIlIlIIl}
        end
      local function III111IIlll1l1IlI1lIl(lIIlI1ll1IlllI111II1, lIlI1IIlllll1llI1Il111)
          lIlI1IIlllll1llI1Il111 = lIlI1IIlllll1llI1Il111 % 64
          if lIlI1IIlllll1llI1Il111 == 0 then
              return {lIIlI1ll1IlllI111II1[1], lIIlI1ll1IlllI111II1[2]}
            end
          if lIlI1IIlllll1llI1Il111 >= 32 then
              local IIIllI1II111I1Il1 = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(15)](lIIlI1ll1IlllI111II1[1], lIlI1IIlllll1llI1Il111 - 32)
              return {0, IIIllI1II111I1Il1}
            end
          local III1lI1lIIII1ll1ll1I1 = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(15)](lIIlI1ll1IlllI111II1[1], lIlI1IIlllll1llI1Il111)
          local l11Il1I1II1l11I1II1Il = lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(12)](lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(15)](lIIlI1ll1IlllI111II1[2], lIlI1IIlllll1llI1Il111), lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(14)](lIIlI1ll1IlllI111II1[1], 32 - lIlI1IIlllll1llI1Il111))
          return {III1lI1lIIII1ll1ll1I1, l11Il1I1II1l11I1II1Il}
        end
      local function IIll1l1I1lllIIlI11I1ll(l1111I1I1l1ll1Il1IIlI, II1IlIlIl11lI11lll1I)
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(10)](l1111I1I1l1ll1Il1IIlI, II1IlIlIl11lI11lll1I)
        end
      local function l1Il1IIl1111IIIIlIl1(IIlIllIIIllI11Il1lI11, l11I1IIIl1Illl1III11I)
          local IIlIl1IllIIIl1Ill1Illl = 73
          IIlIl1IllIIIl1Ill1Illl = 73
          if 1 == 0 then
              local II11IlI11lllIl1llIl1I
            end
          do
              IIlIl1IllIIIl1Ill1Illl = IIlIl1IllIIIl1Ill1Illl
            end
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(11)](IIlIllIIIllI11Il1lI11, l11I1IIIl1Illl1III11I)
        end
      local function lIll111l1I111IllII1l1(IIIl1II1I1lI111llII1I, lIllI1111I1IIl1IlllIII)
          local IIllI1l1l1l1Il1lllll1l = 456
          IIllI1l1l1l1Il1lllll1l = 456
          if 1 == 0 then
              local l1I11I1Ill111IlIl1IIl
            end
          do
              IIllI1l1l1l1Il1lllll1l = IIllI1l1l1l1Il1lllll1l
            end
          local IIlIlIlII1I1lll1Il11l = 914
          IIlIlIlII1I1lll1Il11l = 914
          if 1 == 0 then
              local IIII111ll111I11Illl1l
            end
          do
              IIlIlIlII1I1lll1Il11l = IIlIlIlII1I1lll1Il11l
            end
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(12)](IIIl1II1I1lI111llII1I, lIllI1111I1IIl1IlllIII)
        end
      local function l111I1l1IIIIIIIIII11I(I1I1ll11l1lllI111III1)
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(13)](I1I1ll11l1lllI111III1)
        end
      local function I11I11IIll1II1111IIlI(lII11I1llI1I1III11lII, l1IIl11ll1IIII1IIII1l)
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(14)](lII11I1llI1I1III11lII, l1IIl11ll1IIII1IIII1l)
        end
      local function lI1ll1lI111II11(I1l1IIIl1111lIIlllll, II1l1lIIll1lIlIIIIl1I)
          return lIIlIl1IIIIl1lI1Il1lI[l11lIllIllllIl1I1lI1I(15)](I1l1IIIl1111lIIlllll, II1l1lIIll1lIlIIIIl1I)
        end
      local IIlIlIIIIl1IIlIl1111Il = {206, 35, 106}
      local lII11II1lll1lIIlllI1l = l11IlIll1l1IIIIlII1ll(0)
      for l1Il1l1llI1lll1l11llI = 1, #IIlIlIIIIl1IIlIl1111Il do
          local lIIIl1IlI1l1I1I1lI1l1 = IIlIlIIIIl1IIlIl1111Il[l1Il1l1llI1lll1l11llI]
          local IIllll1IlIl1IIll11I1 = l11IlIll1l1IIIIlII1ll(lIIIl1IlI1l1I1I1lI1l1)
          lII11II1lll1lIIlllI1l = II11l1ll1lll1111l1111(IIl11lIlI11Il1l11I1lI(lII11II1lll1lIIlllI1l, IIllll1IlIl1IIll11I1), lIlI1IllllI1I11ll111ll(I1I1llllIIIl1l1l111ll(IIllll1IlIl1IIll11I1, (l1Il1l1llI1lll1l11llI - 1) % 3), l11IlIll1l1IIIIlII1ll(0xff)))
          lII11II1lll1lIIlllI1l = lIlI1IllllI1I11ll111ll(lII11II1lll1lIIlllI1l, l11IlIll1l1IIIIlII1ll(0xff))
        end
      lII11II1lll1lIIlllI1l = lI1l1II1lI1lII11lII1I(IIl11lIlI11Il1l11I1lI(lII11II1lll1lIIlllI1l, l11IlIll1l1IIIIlII1ll(55 + 5)))
      local lI1Ill1IIlI1II1llll1I = {26, 18, 4, 2, 3, 50, 39, 20, 30, 97, 98, 89, 84, 67, 109, 115, 124, 100, 103, 128, 158, 180, 158, 160, 138, 152, 166, 163, 204, 238, 219, 222, 243, 235, 250, 249, 237, 2, 40, 25}
      local lIlI1I1l1l1lIIIll1llll = ((185 + 162 + lII11II1lll1lIIlllI1l) % 255) + 1
      local l1llllIIlIlIII1lIll = {}
      for lI111llIIl1II1ll11llI = 1, #lI1Ill1IIlI1II1llll1I do
          local IIlll11lIllI1IIl1ll1I1 = (lIlI1I1l1l1lIIIll1llll + (lI111llIIl1II1ll11llI - 1) * 7) % 255
          l1llllIIlIlIII1lIll[lI111llIIl1II1ll11llI] = IIll1l1I1lllIIlI11I1ll(lI1Ill1IIlI1II1llll1I[lI111llIIl1II1ll11llI], IIlll11lIllI1IIl1ll1I1)
        end
      local I111II1lI1llI1llI1lI1 = l1llllIIlIlIII1lIll[(9 - 8)]
      local l11I11Il1l1II111I1I1l = l1llllIIlIlIII1lIll[(3 - 1)]
      local lIIIlll1IlIlIl1I1lI = l1llllIIlIlIII1lIll[(9 - 6)]
      local I1IIlI1lI111l1111lI1l = l1llllIIlIlIII1lIll[(11 - 7)]
      local lII11l1IIII1Il1lI1l = l1llllIIlIlIII1lIll[(12 - 7)]
      local l1lllIlIIIlI1l1llIlIl = l1llllIIlIlIII1lIll[(12 - 6)]
      local I1IIllIIlll111ll1l1l1 = l1llllIIlIlIII1lIll[(14 - 7)]
      local IIllIl1lllIl11I1I111ll = l1llllIIlIlIII1lIll[(10 - 2)]
      local lIIl1lI1llI1l1III111 = l1llllIIlIlIII1lIll[(14 - 5)]
      local lIlII1IlIIII1II1Il1lll = l1llllIIlIlIII1lIll[(17 - 7)]
      local I11I11IIIl1IIIlI1ll = l1llllIIlIlIII1lIll[(18 - 7)]
      local I1l1llIlll1Ill1IIl11 = l1llllIIlIlIII1lIll[(18 - 6)]
      local lIll11Il1II111IlI11I1I = l1llllIIlIlIII1lIll[(22 - 9)]
      local III1ll11Ill1ll1ll1I1l = l1llllIIlIlIII1lIll[(22 - 8)]
      local lI11IIl11Il11IIlll1l1 = l1llllIIlIlIII1lIll[(18 - 3)]
      local I11I1lI11I1l11lI1 = l1llllIIlIlIII1lIll[(25 - 9)]
      local l11lll111l1IlII11I1I = l1llllIIlIlIII1lIll[(23 - 6)]
      local lI1l1I1I1lIllII1Il1l = l1llllIIlIlIII1lIll[(26 - 8)]
      local I1l1I111lII11llllIIlI = l1llllIIlIlIII1lIll[(20 - 1)]
      local I1I1llI1l1IIllIl1I11l = l1llllIIlIlIII1lIll[(26 - 6)]
      local I111lI1lII1l1I1lII11 = l1llllIIlIlIII1lIll[(25 - 4)]
      local IIIIlI1II1IIl1IllIIIl = l1llllIIlIlIII1lIll[(26 - 4)]
      local lIlII1l11ll1lII111III1 = l1llllIIlIlIII1lIll[(28 - 5)]
      local lI1lI1lllII1ll1llI = l1llllIIlIlIII1lIll[(30 - 6)]
      local I11IIl11llIllIlIlll1I = l1llllIIlIlIII1lIll[(29 - 4)]
      local IIIII1lll1Ill1lll1llI = l1llllIIlIlIII1lIll[(29 - 3)]
      local lI1I1111l11lI1IIlIIIl = l1llllIIlIlIII1lIll[(30 - 3)]
      local IIlI11ll1IIIllIl111l1 = l1llllIIlIlIII1lIll[(35 - 7)]
      local I1IllIlI1IllIlIIlIIlI = l1llllIIlIlIII1lIll[(38 - 9)]
      local I11Ill1Ill11l11l1Ill1 = l1llllIIlIlIII1lIll[(32 - 2)]
      local lIll1ll1l1lI111Ill1I1I = l1llllIIlIlIII1lIll[(32 - 1)]
      local lIIIl111l1Il1II1ll1l = l1llllIIlIlIII1lIll[(38 - 6)]
      local IIllI1IIl1ll1IIIIl11 = l1llllIIlIlIII1lIll[(39 - 6)]
      local l1I1l111l1IIII1l1II11 = l1llllIIlIlIII1lIll[(37 - 3)]
      local l11lI11111lI1Ill1II1l = l1llllIIlIlIII1lIll[(39 - 4)]
      local II1IIl1lIIlI1l111lI1I = l1llllIIlIlIII1lIll[(40 - 4)]
      local I1l1lIlll1ll1IIIll1I = l1llllIIlIlIII1lIll[(43 - 6)]
      local lIllI1III1I11IlI11I1I1 = l1llllIIlIlIII1lIll[(39 - 1)]
      local I11IIIIIIII1lllIllIl1 = l1llllIIlIlIII1lIll[(45 - 6)]
      local I11lIl1I1IlIlIlI1llI = l1llllIIlIlIII1lIll[(41 - 1)]
      local lIll1l1l1lIl1IllIIlII = {149, 139}
      local lII11llI11l1llllI1IIl = ((IIll1l1I1lllIIlI11I1ll(76, 32) + lII11II1lll1lIIlllI1l) % 255) + 1
      local I111lllIlIIl1IIIll1l1 = {}
      for II1ll1ll111lIll11Il11 = 1, #lIll1l1l1lIl1IllIIlII do
          local I1lIll1IIlII1lIlIllII = (lII11llI11l1llllI1IIl + (II1ll1ll111lIll11Il11 - 1) * 13) % 255
          I111lllIlIIl1IIIll1l1[II1ll1ll111lIll11Il11] = IIll1l1I1lllIIlI11I1ll(lIll1l1l1lIl1IllIIlII[II1ll1ll111lIll11Il11], I1lIll1IIlII1lIlIllII)
        end
      local I1llIIl11Illl1IlI1I1I = #I111lllIlIIl1IIIll1l1
      local l1II1llI1Il11l1llI1I1 = {{4, l11lIllIllllIl1I1lI1I(16)}, {4, l11lIllIllllIl1I1lI1I(17)}, {4, l11lIllIllllIl1I1lI1I(18)}, {0, l11lIllIllllIl1I1lI1I(19)}, {3, l11lIllIllllIl1I1lI1I(20)}}
      local l1lIIlIl1lIl1l11111II = {144, 198, 208, 135, 220, 113, 195, 67, 179, 238, 25, 35, 23}
      local l111I11IIllI1I1I1lllI = {}
      local I111l11l1lIlllII1IIlI = {}
      local lI1Il11l1I111Il11lI1l = {}
      local lII11lI1IIIl1ll1l1l11 = ((IIll1l1I1lllIIlI11I1ll(25, 78) + lII11II1lll1lIIlllI1l) % 255) + 1
      for IIll1lI111IlI111l11l1l = 1, #l1lIIlIl1lIl1l11111II do
          local l1I11l11IIl1III11IlIl = (lII11lI1IIIl1ll1l1l11 + (IIll1lI111IlI111l11l1l - 1) * 11) % 255
          l111I11IIllI1I1I1lllI[IIll1lI111IlI111l11l1l] = IIll1l1I1lllIIlI11I1ll(l1lIIlIl1lIl1l11111II[IIll1lI111IlI111l11l1l], l1I11l11IIl1III11IlIl)
        end
      local III1I1Il1l1ll1IlIlIl1 = #l111I11IIllI1I1I1lllI
      local l1lII11IIlIIIIII1lIlI = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(21)]
      local function IIllIl1ll1lIl1llIlI1l(IIIlIIIll1llIllIlIlIl)
          if lI1Il11l1I111Il11lI1l[IIIlIIIll1llIllIlIlIl] then
              return I111l11l1lIlllII1IIlI[IIIlIIIll1llIllIlIlIl]
            end
          lI1Il11l1I111Il11lI1l[IIIlIIIll1llIllIlIlIl] = true
          local l1I1IIl1l11Il11llIIII = l1II1llI1Il11l1llI1I1[IIIlIIIll1llIllIlIlIl]
          if not l1I1IIl1l11Il11llIIII then
              return nil
            end
          local I1llIllII11lllI1l111I = l1I1IIl1l11Il11llIIII[1]
          local II1IllIII1II1l1I11lI1 = l1I1IIl1l11Il11llIIII[2]
          local IIll1IIlIlIlIl11lIlIII = {}
          for lI11I1II1llIlIIl = 1, #II1IllIII1II1l1I11lI1 do
              local lIlI1II1ll1I1I1l1I111l = (lI11I1II1llIlIIl - 1) % III1I1Il1l1ll1IlIlIl1 + 1
              local lII111I1I1l1lIl1Ill11 = l1lII11IIlIIIIII1lIlI(II1IllIII1II1l1I11lI1, lI11I1II1llIlIIl) - l111I11IIllI1I1I1lllI[lIlI1II1ll1I1I1l1I111l]
              if lII111I1I1l1lIl1Ill11 < 0 then
                  lII111I1I1l1lIl1Ill11 = lII111I1I1l1lIl1Ill11 + 256
                end
              IIll1IIlIlIlIl11lIlIII[lI11I1II1llIlIIl] = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](lII111I1I1l1lIl1Ill11)
            end
          local l1l11lI1IlIlIl1lIIIll = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(2)][l11lIllIllllIl1I1lI1I(7)](IIll1IIlIlIlIl11lIlIII)
          local lIl1lll111lll1IIIlIlI
          if I1llIllII11lllI1l111I == 0 then
              lIl1lll111lll1IIIlIlI = nil
      elseif I1llIllII11lllI1l111I == 1 then
              lIl1lll111lll1IIIlIlI = false
      elseif I1llIllII11lllI1l111I == 2 then
              lIl1lll111lll1IIIlIlI = true
      elseif I1llIllII11lllI1l111I == 3 then
              lIl1lll111lll1IIIlIlI = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(22)](l1l11lI1IlIlIl1lIIIll)
            else
              lIl1lll111lll1IIIlIlI = l1l11lI1IlIlIl1lIIIll
            end
          I111l11l1lIlllII1IIlI[IIIlIIIll1llIllIlIlIl] = lIl1lll111lll1IIIlIlI
          return lIl1lll111lll1IIIlIlI
        end
      local IIllI11IIl1l1IllII11lI = {II1I11IIl1I1lIII1IIll, I1I1III1lIIlIlIlllIl1}
      local lIll1lI11llIl11l111l1I = {}
      local l1lIlI1l1Il1I1I11lll = 0
      local l111l11IIl11IlIl1l1
      local l1l1IlIllI1l1ll1IIl = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(5)]
      if I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(6)](l1l1IlIllI1l1ll1IIl) == l11lIllIllllIl1I1lI1I(1) then
          l111l11IIl11IlIl1l1 = l1l1IlIllI1l1ll1IIl(1)
        end
      if I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(6)](l111l11IIl11IlIl1l1) ~= l11lIllIllllIl1I1lI1I(2) then
          l111l11IIl11IlIl1l1 = _G
        end
      local II1l111I11llll111ll11 = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(2)][l11lIllIllllIl1I1lI1I(23)]
      local lIlIII1IIIllIIlll1III = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(2)][l11lIllIllllIl1I1lI1I(24)]
      local IIII1lII1I1IIl1ll = {I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](80, 223, 240, 1, 134, 35, 52, 69, 195, 103, 120, 137, 21, 171, 188, 205, 88, 239, 0, 17, 166, 51, 68, 85, 239, 119, 136, 153, 63, 187, 204, 221, 123, 255, 16, 33, 162, 67, 84, 101, 241, 135, 152, 169, 62, 203, 220, 237, 103, 15, 32, 49, 215, 83, 100, 117, 19, 151, 168, 185) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](104, 219, 236, 253, 138, 31, 48, 65, 214, 99, 116, 133, 25, 167, 184, 201, 78, 235, 252, 13, 139, 47, 64, 81, 237, 115, 132, 149, 33, 183, 200, 217, 110, 251, 12, 29, 172, 63, 80, 97, 231, 131, 148, 165, 35, 199, 216, 233, 88, 11, 28, 45, 186, 79, 96, 113, 6, 147, 164, 181) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](73, 215, 232, 249, 157, 27, 44, 61, 219, 95, 112, 129, 29, 163, 180, 197, 83, 231, 248, 9, 158, 43, 60, 77, 192, 111, 128, 145, 53, 179, 196, 213, 115, 247, 8, 25, 168, 59, 76, 93, 234, 127, 144, 161, 54, 195, 212, 229, 116, 7, 24, 41, 175, 75, 92, 109, 235, 143, 160, 177) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](82, 211, 228, 245, 134, 23, 40, 57, 206, 91, 108, 125, 5, 159, 176, 193, 68, 227, 244, 5, 131, 39, 56, 73, 213, 107, 124, 141, 30, 175, 192, 209, 102, 243, 4, 21, 178, 55, 72, 89, 254, 123, 140, 157, 56, 191, 208, 225, 98, 3, 20, 37, 181, 71, 88, 105, 254, 139, 156, 173) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](63, 207, 224, 241, 145, 19, 36, 53, 211, 87, 104, 121, 26, 155, 172, 189, 79, 223, 240, 1, 150, 35, 52, 69, 200, 103, 120, 137, 10, 171, 188, 205, 75, 239, 0, 17, 173, 51, 68, 85, 228, 119, 136, 153, 46, 187, 204, 221, 112, 255, 16, 33, 160, 67, 84, 101, 227, 135, 152, 169) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](63, 203, 220, 237, 120, 15, 32, 49, 196, 83, 100, 117, 7, 151, 168, 185, 86, 219, 236, 253, 155, 31, 48, 65, 194, 99, 116, 133, 26, 167, 184, 201, 94, 235, 252, 13, 128, 47, 64, 81, 255, 115, 132, 149, 51, 183, 200, 217, 116, 251, 12, 29, 174, 63, 80, 97, 246, 131, 148, 165) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](11, 199, 216, 233, 111, 11, 28, 45, 171, 79, 96, 113, 11, 147, 164, 181, 107, 215, 232, 249, 142, 27, 44, 61, 250, 95, 112, 129, 7, 163, 180, 197, 67, 231, 248, 9, 149, 43, 60, 77, 210, 111, 128, 145, 38, 179, 196, 213, 103, 247, 8, 25, 184, 59, 76, 93, 251, 127, 144, 161), I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](61, 195, 212, 229, 113, 7, 24, 41, 190, 75, 92, 109, 224, 143, 160, 177, 94, 211, 228, 245, 147, 23, 40, 57, 210, 91, 108, 125, 10, 159, 176, 193, 86, 227, 244, 5, 151, 39, 56, 73, 204, 107, 124, 141, 11, 175, 192, 209, 104, 243, 4, 21, 181, 55, 72, 89, 238, 123, 140, 157) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](26, 191, 208, 225, 103, 3, 20, 37, 163, 71, 88, 105, 245, 139, 156, 173, 57, 207, 224, 241, 134, 19, 36, 53, 201, 87, 104, 121, 26, 155, 172, 189, 91, 223, 240, 1, 180, 35, 52, 69, 210, 103, 120, 137, 30, 171, 188, 205, 82, 239, 0, 17, 131, 51, 68, 85, 243, 119, 136, 153) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](15, 187, 204, 221, 106, 255, 16, 33, 182, 67, 84, 101, 232, 135, 152, 169, 43, 203, 220, 237, 107, 15, 32, 49, 220, 83, 100, 117, 0, 151, 168, 185, 78, 219, 236, 253, 190, 31, 48, 65, 199, 99, 116, 133, 3, 167, 184, 201, 65, 235, 252, 13, 155, 47, 64, 81, 230, 115, 132, 149) .. I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(3)](61, 183, 200, 217, 74, 251, 12, 29, 187, 63, 80, 97, 215, 131, 148, 165, 50, 199, 216, 233, 126, 11, 28, 45, 160, 79, 96, 113, 20, 147, 164, 181, 83, 215, 232, 249, 145, 27, 44, 61, 203, 95, 112, 129, 22, 163, 180, 197, 92, 231, 248, 9, 143, 43, 60, 77, 203, 111, 128, 145)}
      local I1II1lIIIl11lI1IlIIlI = {1, 2}
      local II1ll111ll1ll1IllI = {}
      for II111111Il1l111III1l1 = 1, #I1II1lIIIl11lI1IlIIlI do
          II1ll111ll1ll1IllI[II111111Il1l111III1l1] = IIII1lII1I1IIl1ll[I1II1lIIIl11lI1IlIIlI[II111111Il1l111III1l1]]
        end
      local I1l11l1ll1lI1IlIIIlI = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(2)][l11lIllIllllIl1I1lI1I(7)](II1ll111ll1ll1IllI)
      local l1IlllIIIlIIl1I111II = ((11 + 31 + lII11II1lll1lIIlllI1l) % 255) + 1
      local IIl1llllIIl1lllll1l1l1 = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(4)][l11lIllIllllIl1I1lI1I(21)]
      local function lIllIIlIIIIlIII1lII1l1(IIll1lI111lIII1llllll1)
          local lIlI1l1IIIIIll1l1I1I1 = IIl1llllIIl1lllll1l1l1(I1l11l1ll1lI1IlIIIlI, IIll1lI111lIII1llllll1)
          local II11llIlIIlI1lIII1I1l = (l1IlllIIIlIIl1I111II + (IIll1lI111lIII1llllll1 - 1) * 17) % 256
          return IIll1l1I1lllIIlI11I1ll(lIlI1l1IIIIIll1l1I1I1, II11llIlIIlI1lIII1I1l)
        end
      local function III1IlIIIlllll11llI1l(I11l1IIIIllI1Il11111l)
          local IIIII11111I1IlI1lllII = lIllIIlIIIIlIII1lII1l1(I11l1IIIIllI1Il11111l)
          local lIl1lIlI11I1l1lIll1I1 = lIllIIlIIIIlIII1lII1l1(I11l1IIIIllI1Il11111l + 1)
          local I11IlI1III1l1I1llI1 = lIllIIlIIIIlIII1lII1l1(I11l1IIIIllI1Il11111l + 2)
          local lIlIIl1lII1lII1II1IlIl = lIllIIlIIIIlIII1lII1l1(I11l1IIIIllI1Il11111l + 3)
          return IIIII11111I1IlI1lllII + lIl1lIlI11I1l1lIll1I1 * 256 + I11IlI1III1l1I1llI1 * 65536 + lIlIIl1lII1lII1II1IlIl * 16777216
        end
      local function l1I1llIIIlIlIIl111ll1(l1l1lIllII1lI1lII1III)
          local lIII11lIll1IlllII1I = 978
          lIII11lIll1IlllII1I = 978
          if 1 == 0 then
              local I11Il1lllIllllIll1llI
            end
          do
              lIII11lIll1IlllII1I = lIII11lIll1IlllII1I
            end
          local II1Il1IlI1IIlIl1llIl1 = 103
          II1Il1IlI1IIlIl1llIl1 = 103
          if 1 == 0 then
              local I1I1lIIIIIIIl11lI1I11
            end
          do
              II1Il1IlI1IIlIl1llIl1 = II1Il1IlI1IIlIl1llIl1
            end
          local lIl11IIIIIlll1IlIlII1 = (l1l1lIllII1lI1lII1III - 1) * 12 + 1
          local lIllIl1I11Ill11Il1IllI = III1IlIIIlllll11llI1l(lIl11IIIIIlll1IlIlII1)
          local IIlIlIIllI1lIIllIIlI1 = III1IlIIIlllll11llI1l(lIl11IIIIIlll1IlIlII1 + 4)
          local II1lIl1llIIlIlI1IIl1 = III1IlIIIlllll11llI1l(lIl11IIIIIlll1IlIlII1 + 8)
          return lIllIl1I11Ill11Il1IllI, IIlIlIIllI1lIIllIIlI1, II1lIl1llIIlIlI1IIl1
        end
      local I1lIIll1l11llIIII1l1l = 1
      while true do
          local l11II11I1lIl11lI1I1I1, lIllII111lll1III11lIlI, II1Il1IlI1I111l11IlIl = l1I1llIIIlIlIIl111ll1(I1lIIll1l11llIIII1l1l)
          local IIllllIlI1llIl1Ill11ll = 0
          if I1llIIl11Illl1IlI1I1I > 0 then
              local lI111I11l1l1ll1ll111l = ((I1lIIll1l11llIIII1l1l + lII11II1lll1lIIlllI1l - 1) % I1llIIl11Illl1IlI1I1I) + 1
              IIllllIlI1llIl1Ill11ll = I111lllIlIIl1IIIll1l1[lI111I11l1l1ll1ll111l]
              l11II11I1lIl11lI1I1I1 = IIll1l1I1lllIIlI11I1ll(l11II11I1lIl11lI1I1I1, IIllllIlI1llIl1Ill11ll)
              lIllII111lll1III11lIlI = IIll1l1I1lllIIlI11I1ll(lIllII111lll1III11lIlI, IIllllIlI1llIl1Ill11ll)
              II1Il1IlI1I111l11IlIl = IIll1l1I1lllIIlI11I1ll(II1Il1IlI1I111l11IlIl, IIllllIlI1llIl1Ill11ll)
            end
          if l11II11I1lIl11lI1I1I1 == I111II1lI1llI1llI1lI1 then
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == l11I11Il1l1II111I1I1l then
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = IIllIl1ll1lIl1llIlI1l(lIllII111lll1III11lIlI)
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIIIlll1IlIlIl1I1lI then
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = IIllI11IIl1l1IllII11lI[lIllII111lll1III11lIlI]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1IIlI1lI111l1111lI1l then
              IIllI11IIl1l1IllII11lI[lIllII111lll1III11lIlI] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lII11l1IIII1Il1lI1l then
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = l111l11IIl11IlIl1l1[IIllIl1ll1lIl1llIlI1l(lIllII111lll1III11lIlI)]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == l1lllIlIIIlI1l1llIlIl then
              l111l11IIl11IlIl1l1[IIllIl1ll1lIl1llIlI1l(lIllII111lll1III11lIlI)] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1IIllIIlll111ll1l1l1 then
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = {}
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == IIllIl1lllIl11I1I111ll then
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIIl1lI1llI1l1III111 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIlII1IlIIII1II1Il1lll then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I11I11IIIl1IIIlI1ll then
              local lIlIl11lI1l1ll11l1l111 = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              local IIll1lI11II1l1lIlI1llI = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = IIll1lI11II1l1lIlI1llI[lIlIl11lI1l1ll11l1l111]
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1l1llIlll1Ill1IIl11 then
              local IIlIIII11Il1I1l1l11l = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              local lIlllIlIlIIl1I11II11II = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = nil
              local IIlIIllII1llI1I1lIII11 = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 2]
              IIlIIllII1llI1I1lIII11[lIlllIlIlIIl1I11II11II] = IIlIIII11Il1I1l1l11l
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 2] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 3
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIll11Il1II111IlI11I1I then
              local IIllll1IIIIlII11I1I1lI = lIllII111lll1III11lIlI
              local l1IIIlIIIllllIl1lIIll = II1Il1IlI1I111l11IlIl
              local lIlll111I1111l111lIl1 = l1lIlI1l1Il1I1I11lll - IIllll1IIIIlII11I1I1lI
              local IIlllI1II1lIII1I1111Il = lIll1lI11llIl11l111l1I[lIlll111I1111l111lIl1]
              if l1IIIlIIIllllIl1lIIll == 0 then
                  IIlllI1II1lIII1I1111Il(lIlIII1IIIllIIlll1III(lIll1lI11llIl11l111l1I, lIlll111I1111l111lIl1 + 1, l1lIlI1l1Il1I1I11lll))
                  for I1l1IIllIl1I111I1ll1 = l1lIlI1l1Il1I1I11lll, lIlll111I1111l111lIl1, -1 do
                      lIll1lI11llIl11l111l1I[I1l1IIllIl1I111I1ll1] = nil
                    end
                  l1lIlI1l1Il1I1I11lll = lIlll111I1111l111lIl1 - 1
                else
                  local IIll111llIIll11l1I1ll1 = II1l111I11llll111ll11(IIlllI1II1lIII1I1111Il(lIlIII1IIIllIIlll1III(lIll1lI11llIl11l111l1I, lIlll111I1111l111lIl1 + 1, l1lIlI1l1Il1I1I11lll)))
                  for l11IIIIIllll1IIIl1II1 = l1lIlI1l1Il1I1I11lll, lIlll111I1111l111lIl1, -1 do
                      lIll1lI11llIl11l111l1I[l11IIIIIllll1IIIl1II1] = nil
                    end
                  l1lIlI1l1Il1I1I11lll = lIlll111I1111l111lIl1 - 1
                  if l1IIIlIIIllllIl1lIIll == 1 then
                      l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
                      lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = IIll111llIIll11l1I1ll1[1]
                    else
                      for lIlI11l1ll1IIllIIlIIlI = 1, l1IIIlIIIllllIl1lIIll do
                          l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll + 1
                          lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = IIll111llIIll11l1I1ll1[lIlI11l1ll1IIllIIlIIlI]
                        end
                    end
                end
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == III1ll11Ill1ll1ll1I1l then
              local I11lIIl1I1111111III = lIllII111lll1III11lIlI
              if I11lIIl1I1111111III == 0 then
                  return
        elseif I11lIIl1I1111111III == 1 then
                  return lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
                else
                  local II11lllllII1l11llII1I = l1lIlI1l1Il1I1I11lll - I11lIIl1I1111111III + 1
                  return lIlIII1IIIllIIlll1III(lIll1lI11llIl11l111l1I, II11lllllII1l11llII1I, l1lIlI1l1Il1I1I11lll)
                end
      elseif l11II11I1lIl11lI1I1I1 == lI11IIl11Il11IIlll1l1 then
              I1lIIll1l11llIIII1l1l = lIllII111lll1III11lIlI
      elseif l11II11I1lIl11lI1I1I1 == I11I1lI11I1l11lI1 then
              if not lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] then
                  I1lIIll1l11llIIII1l1l = lIllII111lll1III11lIlI
                else
                  I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
                end
      elseif l11II11I1lIl11lI1I1I1 == l11lll111l1IlII11I1I then
              if lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] then
                  I1lIIll1l11llIIII1l1l = lIllII111lll1III11lIlI
                else
                  I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
                end
      elseif l11II11I1lIl11lI1I1I1 == lI1l1I1I1lIllII1Il1l then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] + lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1l1I111lII11llllIIlI then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] - lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1I1llI1l1IIllIl1I11l then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] * lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I111lI1lII1l1I1lII11 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] / lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == IIIIlI1II1IIl1IllIIIl then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(9)][l11lIllIllllIl1I1lI1I(8)](lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] / lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIlII1l11ll1lII111III1 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] % lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lI1lI1lllII1ll1llI then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] ^ lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I11IIl11llIllIlIlll1I then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] .. lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == IIIII1lll1Ill1lll1llI then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] == lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lI1I1111l11lI1IIlIIIl then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] ~= lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == IIlI11ll1IIIllIl111l1 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] < lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1IllIlI1IllIlIIlIIlI then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] <= lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I11Ill1Ill11l11l1Ill1 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] > lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIll1ll1l1lI111Ill1I1I then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] >= lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIIIl111l1Il1II1ll1l then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = l1Il1IIl1111IIIIlIl1(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == IIllI1IIl1ll1IIIIl11 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lIll111l1I111IllII1l1(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == l1I1l111l1IIII1l1II11 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = IIll1l1I1lllIIlI11I1ll(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == l11lI11111lI1Ill1II1l then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = I11I11IIll1II1111IIlI(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == II1IIl1lIIlI1l111lI1I then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1] = lI1ll1lI111II11(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll - 1], lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = nil
              l1lIlI1l1Il1I1I11lll = l1lIlI1l1Il1I1I11lll - 1
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I1l1lIlll1ll1IIIll1I then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = -lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == lIllI1III1I11IlI11I1I1 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = not lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I11IIIIIIII1lllIllIl1 then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = #lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll]
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
      elseif l11II11I1lIl11lI1I1I1 == I11lIl1I1IlIlIlI1llI then
              lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll] = l111I1l1IIIIIIIIII11I(lIll1lI11llIl11l111l1I[l1lIlI1l1Il1I1I11lll])
              I1lIIll1l11llIIII1l1l = I1lIIll1l11llIIII1l1l + 1
            else
              return
            end
        end
    end
end
I1I1lII1IlllllI1II11[l11lIllIllllIl1I1lI1I(25)](IIlIllllll1lI1I1l1lI(2, 6))