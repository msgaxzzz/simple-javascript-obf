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
local IIl1II1Il1l11l1llIl1I = {{170, 103, 201, 235, 132, 83, 160, 76}, {184, 83, 189, 244, 117}, {167, 90, 188, 250}, {183, 102, 205, 241, 126, 81}, {171, 87, 207, 238, 117, 88, 167}, {184, 107, 203, 237}, {167, 97, 201, 235, 113, 94}, {170, 94, 202, 247, 130}, {177, 83, 207, 240}, {166, 106, 202, 250}, {166, 83, 201, 236}, {166, 97, 205}, {166, 96, 202, 252}, {176, 101, 195, 241, 118, 94}, {182, 101, 195, 241, 118, 94}, {7, 131, 139, 185}, {7, 127, 125, 188}, {7, 141, 125, 179, 28, 81}, {}, {6, 142, 30, 57}, {166, 107, 207, 237}, {184, 97, 201, 253, 125, 76, 150, 80}, {180, 83, 190, 243}, {185, 96, 203, 233, 115, 85}, {180, 100, 196, 246, 132}}
local IIII11lIIll1I1l1IIII1 = {68, 242, 91, 136, 16, 234, 49, 222, 126, 153, 41}
local lIIl1llIIlI1lllll1l1l = {}
local function I11lI1IlIIl1IlIll11I(l11lIllIllllIl1I1lI1I)
  local lIlIlll1l111I111lI1Ill = 298
  lIlIlll1l111I111lI1Ill = 298
  if 1 == 0 then
      local I1lI1lIlII1ll1lIIIlI1
    end
  do
      lIlIlll1l111I111lI1Ill = lIlIlll1l111I111lI1Ill
    end
  local IIllII1llIlI11IllI11lI = lIIl1llIIlI1lllll1l1l[l11lIllIllllIl1I1lI1I]
  if IIllII1llIlI11IllI11lI ~= nil then
      return IIllII1llIlI11IllI11lI
    end
  local lI1IllIl1IIl1lIIllIl = IIl1II1Il1l11l1llIl1I[l11lIllIllllIl1I1lI1I]
  local IIlIIl11I111IlllIIl1I1 = {}
  local II1llllll1I1IlllllI11 = #IIII11lIIll1I1l1IIII1
  for lII1l11lIllII11lI11I = 1, #lI1IllIl1IIl1lIIllIl do
      local l1IIlI1lIII11111lIII1 = lII1l11lIllII11lI11I - 1
      l1IIlI1lIII11111lIII1 = l1IIlI1lIII11111lIII1 % II1llllll1I1IlllllI11
      l1IIlI1lIII11111lIII1 = l1IIlI1lIII11111lIII1 + 1
      local I1I11l11I1ll11lI1IIl1 = lI1IllIl1IIl1lIIllIl[lII1l11lIllII11lI11I] - IIII11lIIll1I1l1IIII1[l1IIlI1lIII11111lIII1]
      if I1I11l11I1ll11lI1IIl1 < 0 then
          I1I11l11I1ll11lI1IIl1 = I1I11l11I1ll11lI1IIl1 + 256
        end
      IIlIIl11I111IlllIIl1I1[lII1l11lIllII11lI11I] = string.char(I1I11l11I1ll11lI1IIl1)
    end
  local I1II111lIl1I11IIl11I = table.concat(IIlIIl11I111IlllIIl1I1)
  lIIl1llIIlI1lllll1l1l[l11lIllIllllIl1I1lI1I] = I1II111lIl1I11IIl11I
  return I1II111lIl1I11IIl11I
end
local l1lll111IlIlllI1l1l1l = nil
local I1I1lII1IlllllI1II11 = getfenv
if type(I1I1lII1IlllllI1II11) == I11lI1IlIIl1IlIll11I(1) then
  l1lll111IlIlllI1l1l1l = I1I1lII1IlllllI1II11(1)
end
if type(l1lll111IlIlllI1l1l1l) ~= I11lI1IlIIl1IlIll11I(2) then
  l1lll111IlIlllI1l1l1l = _G
end
local function lI1IIIllllI1I1IIIII11(IIlIllllll1lI1I1l1lI, II1I11IIl1I1lIII1IIll)
  do
      local I1I1III1lIIlIlIlllIl1 = 4294967296
      local lIlIlIlI11Il1III1llII
      do
          local lIIlIl1IIIIl1lI1Il1lI = 57
          local IIllIllI1lIIIllIlII1I1 = {41, 48, 59, 250, 249}
          local lI1Illl1IlIll1I1I111 = {}
          for IIll1lll1llIlI11II1II = 1, #IIllIllI1lIIIllIlII1I1 do
              lI1Illl1IlIll1I1I111[IIll1lll1llIlI11II1II] = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)]((IIllIllI1lIIIllIlII1I1[IIll1lll1llIlI11II1II] + lIIlIl1IIIIl1lI1Il1lI) % 256)
            end
          local l1llIllIlII1llIlI1III
          local l1l1llIllII111l1lI = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(5)]
          if l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(6)](l1l1llIllII111l1lI) == I11lI1IlIIl1IlIll11I(1) then
              l1llIllIlII1llIlI1III = l1l1llIllII111l1lI(1)
            end
          if l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(6)](l1llIllIlII1llIlI1III) ~= I11lI1IlIIl1IlIll11I(2) then
              l1llIllIlII1llIlI1III = _G
            end
          lIlIlIlI11Il1III1llII = l1llIllIlII1llIlI1III[l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(2)][I11lI1IlIIl1IlIll11I(7)](lI1Illl1IlIll1I1I111)]
        end
      if lIlIlIlI11Il1III1llII == nil then
          local function l11IlII111lll1ll1I11(IIlIIIllIllllI1lI11II1)
              IIlIIIllIllllI1lI11II1 = IIlIIIllIllllI1lI11II1 % I1I1III1lIIlIlIlllIl1
              if IIlIIIllIllllI1lI11II1 < 0 then
                  IIlIIIllIllllI1lI11II1 = IIlIIIllIllllI1lI11II1 + I1I1III1lIIlIlIlllIl1
                end
              return IIlIIIllIllllI1lI11II1
            end
          lIlIlIlI11Il1III1llII = {}
          function lIlIlIlI11Il1III1llII.lIllllIIl11l1IIII1lll(II1l11II1llI1111l11lI, IIll1lIll111I11ll1I1I)
              II1l11II1llI1111l11lI = l11IlII111lll1ll1I11(II1l11II1llI1111l11lI)
              IIll1lIll111I11ll1I1I = l11IlII111lll1ll1I11(IIll1lIll111I11ll1I1I)
              local lIllII1l1IlIl11l1IlIIl = 0
              local IIIII1IlllI1111IIl11l = 1
              for I1Il1lllIIIl1llI1I1Il = 0, 31 do
                  local IIll1Il11lll1I11lIIllI = II1l11II1llI1111l11lI % 2
                  local lIIIllI1IlIl11II1lII = IIll1lIll111I11ll1I1I % 2
                  if IIll1Il11lll1I11lIIllI == 1 and lIIIllI1IlIl11II1lII == 1 then
                      lIllII1l1IlIl11l1IlIIl = lIllII1l1IlIl11l1IlIIl + IIIII1IlllI1111IIl11l
                    end
                  II1l11II1llI1111l11lI = (II1l11II1llI1111l11lI - IIll1Il11lll1I11lIIllI) / 2
                  IIll1lIll111I11ll1I1I = (IIll1lIll111I11ll1I1I - lIIIllI1IlIl11II1lII) / 2
                  IIIII1IlllI1111IIl11l = IIIII1IlllI1111IIl11l * 2
                end
              return lIllII1l1IlIl11l1IlIIl
            end
          function lIlIlIlI11Il1III1llII.l1l11lIl1IIIll1IIIlII(lIl1I1IIl11lllIll1Il1, IIl1lll11III11l1Il1l1I)
              lIl1I1IIl11lllIll1Il1 = l11IlII111lll1ll1I11(lIl1I1IIl11lllIll1Il1)
              IIl1lll11III11l1Il1l1I = l11IlII111lll1ll1I11(IIl1lll11III11l1Il1l1I)
              local lIllll1lI11IIl1ll1llI1 = 0
              local I1I11llII1l111llIl1Il = 1
              for I1llIIllIl1l11llII1ll = 0, 31 do
                  local lI11lllll1llI11Il111 = lIl1I1IIl11lllIll1Il1 % 2
                  local II11llI1I111lIIlIIII1 = IIl1lll11III11l1Il1l1I % 2
                  if lI11lllll1llI11Il111 == 1 or II11llI1I111lIIlIIII1 == 1 then
                      lIllll1lI11IIl1ll1llI1 = lIllll1lI11IIl1ll1llI1 + I1I11llII1l111llIl1Il
                    end
                  lIl1I1IIl11lllIll1Il1 = (lIl1I1IIl11lllIll1Il1 - lI11lllll1llI11Il111) / 2
                  IIl1lll11III11l1Il1l1I = (IIl1lll11III11l1Il1l1I - II11llI1I111lIIlIIII1) / 2
                  I1I11llII1l111llIl1Il = I1I11llII1l111llIl1Il * 2
                end
              return lIllll1lI11IIl1ll1llI1
            end
          function lIlIlIlI11Il1III1llII.IIIlllIlII1l1lII1ll1l(I11l11lllIlII1I1I1Ill, lIllllI1I1lIIIll11I1ll)
              I11l11lllIlII1I1I1Ill = l11IlII111lll1ll1I11(I11l11lllIlII1I1I1Ill)
              lIllllI1I1lIIIll11I1ll = l11IlII111lll1ll1I11(lIllllI1I1lIIIll11I1ll)
              local lIlIIIl1lIl1IIll1lI = 0
              local I11lll1I1lI111I1lI1 = 1
              for I11I1IlllI1I1I1ll1I1I = 0, 31 do
                  local l1l1lllI11lI1IlI1II1 = I11l11lllIlII1I1I1Ill % 2
                  local I1llI11lIlI11IlIll11 = lIllllI1I1lIIIll11I1ll % 2
                  if l1l1lllI11lI1IlI1II1 + I1llI11lIlI11IlIll11 == 1 then
                      lIlIIIl1lIl1IIll1lI = lIlIIIl1lIl1IIll1lI + I11lll1I1lI111I1lI1
                    end
                  I11l11lllIlII1I1I1Ill = (I11l11lllIlII1I1I1Ill - l1l1lllI11lI1IlI1II1) / 2
                  lIllllI1I1lIIIll11I1ll = (lIllllI1I1lIIIll11I1ll - I1llI11lIlI11IlIll11) / 2
                  I11lll1I1lI111I1lI1 = I11lll1I1lI111I1lI1 * 2
                end
              return lIlIIIl1lIl1IIll1lI
            end
          function lIlIlIlI11Il1III1llII.III1IIl11lI1IlI1lIII(II111I11lllll1I1l1II1)
              local lI1lII111llIl1lI1IIl = 505
              lI1lII111llIl1lI1IIl = 505
              if 1 == 0 then
                  local I1111111IIIlIIlI111I1
                end
              do
                  lI1lII111llIl1lI1IIl = lI1lII111llIl1lI1IIl
                end
              return I1I1III1lIIlIlIlllIl1 - 1 - l11IlII111lll1ll1I11(II111I11lllll1I1l1II1)
            end
          function lIlIlIlI11Il1III1llII.l11Ill1IIl1IIl1l11I1(III11IlIlIIlIIIIIl1l, lIII1lIllIl1lI1l1I)
              lIII1lIllIl1lI1l1I = lIII1lIllIl1lI1l1I % 32
              return (l11IlII111lll1ll1I11(III11IlIlIIlIIIIIl1l) * (2 ^ lIII1lIllIl1lI1l1I)) % I1I1III1lIIlIlIlllIl1
            end
          function lIlIlIlI11Il1III1llII.I1I1IllI11IlII111111l(IIIlllII1I1III1111IlI, l1lI1l1l11IIll11ll111)
              l1lI1l1l11IIll11ll111 = l1lI1l1l11IIll11ll111 % 32
              return l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(9)][I11lI1IlIIl1IlIll11I(8)](l11IlII111lll1ll1I11(IIIlllII1I1III1111IlI) / (2 ^ l1lI1l1l11IIll11ll111))
            end
        end
      local function I1IIlIIIIll111IIll1(lIlIl1l1l1l11lIl1ll11, I1I1l1llll1l1lIll1Il1)
          return {lIlIl1l1l1l11lIl1ll11, I1I1l1llll1l1lIll1Il1}
        end
      local function lIIlIIIl11lI1III11III(l11IlIll1l1IIIIlII1ll)
          return {0, l11IlIll1l1IIIIlII1ll % I1I1III1lIIlIlIlllIl1}
        end
      local function lI1lIII1III11Il11lII(lIIllIIlII1l11I1l1l11)
          return lIIllIIlII1l11I1l1l11[2]
        end
      local function I1l111II1ll1I1ll1lllI(IIl11lIlI11Il1l11I1lI, IIl1llIIlI1II1lIII1I)
          local I1llIlIl1llIllIIlll1I = IIl11lIlI11Il1l11I1lI[2] + IIl1llIIlI1II1lIII1I[2]
          local III1IIl11II1III1IIlll = 0
          if I1llIlIl1llIllIIlll1I >= I1I1III1lIIlIlIlllIl1 then
              I1llIlIl1llIllIIlll1I = I1llIlIl1llIllIIlll1I - I1I1III1lIIlIlIlllIl1
              III1IIl11II1III1IIlll = 1
            end
          local lI11l1Il1lIlI11lll1II = (IIl11lIlI11Il1l11I1lI[1] + IIl1llIIlI1II1lIII1I[1] + III1IIl11II1III1IIlll) % I1I1III1lIIlIlIlllIl1
          return {lI11l1Il1lIlI11lll1II, I1llIlIl1llIllIIlll1I}
        end
      local function lI11llI1llI1IIlIlI1ll(l111lIl11Ill1IllI11I, II111II1l111lllll11Il)
          return ((l111lIl11Ill1IllI11I[1] % II111II1l111lllll11Il) * (I1I1III1lIIlIlIlllIl1 % II111II1l111lllll11Il) + (l111lIl11Ill1IllI11I[2] % II111II1l111lllll11Il)) % II111II1l111lllll11Il
        end
      local function IIl1l1Il1IIllIIlIlIl(lI1l1II1lI1lII11lII1I)
          return ((lI1l1II1lI1lII11lII1I[1] % 255) * 1 + (lI1l1II1lI1lII11lII1I[2] % 255)) % 255
        end
      local function IIllllI1I1I11l1IlI1lI(II11l1ll1lll1111l1111, lIIII1I1IlII1Il1l1I1I)
          return {lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(10)](II11l1ll1lll1111l1111[1], lIIII1I1IlII1Il1l1I1I[1]), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(10)](II11l1ll1lll1111l1111[2], lIIII1I1IlII1Il1l1I1I[2])}
        end
      local function I11I111lll1ll1I1l11l(lIlI1IllllI1I11ll111ll, I1l1lll1ll111II11IIl1)
          return {lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(11)](lIlI1IllllI1I11ll111ll[1], I1l1lll1ll111II11IIl1[1]), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(11)](lIlI1IllllI1I11ll111ll[2], I1l1lll1ll111II11IIl1[2])}
        end
      local function II1lll111l1IIl1lII(lIlIIlIl1l1I1lI11I11II, I11IllI1II1l11l1IIIl)
          return {lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(12)](lIlIIlIl1l1I1lI11I11II[1], I11IllI1II1l11l1IIIl[1]), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(12)](lIlIIlIl1l1I1lI11I11II[2], I11IllI1II1l11l1IIIl[2])}
        end
      local function I111lII1llI11IllI11(I1Il1ll1I1l111lI1I1I1)
          return {lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(13)](I1Il1ll1I1l111lI1I1I1[1]), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(13)](I1Il1ll1I1l111lI1I1I1[2])}
        end
      local function lIlII11lIllIIIll1llll1(I1I1llllIIIl1l1l111ll, lIIlII11I11I1II1l11lI)
          lIIlII11I11I1II1l11lI = lIIlII11I11I1II1l11lI % 64
          if lIIlII11I11I1II1l11lI == 0 then
              return {I1I1llllIIIl1l1l111ll[1], I1I1llllIIIl1l1l111ll[2]}
            end
          if lIIlII11I11I1II1l11lI >= 32 then
              local lI1lI1lIll111lII11l1I = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(14)](I1I1llllIIIl1l1l111ll[2], lIIlII11I11I1II1l11lI - 32)
              return {lI1lI1lIll111lII11l1I, 0}
            end
          local lIlll1IlI1IIll1I1l1IIl = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(12)](lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(14)](I1I1llllIIIl1l1l111ll[1], lIIlII11I11I1II1l11lI), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(15)](I1I1llllIIIl1l1l111ll[2], 32 - lIIlII11I11I1II1l11lI))
          local I1l1IlI11ll1llll1lII = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(14)](I1I1llllIIIl1l1l111ll[2], lIIlII11I11I1II1l11lI)
          return {lIlll1IlI1IIll1I1l1IIl, I1l1IlI11ll1llll1lII}
        end
      local function lIllIlI1lIIIllIIlIlIIl(III111IIlll1l1IlI1lIl, lIIlI1ll1IlllI111II1)
          lIIlI1ll1IlllI111II1 = lIIlI1ll1IlllI111II1 % 64
          if lIIlI1ll1IlllI111II1 == 0 then
              return {III111IIlll1l1IlI1lIl[1], III111IIlll1l1IlI1lIl[2]}
            end
          if lIIlI1ll1IlllI111II1 >= 32 then
              local lIlI1IIlllll1llI1Il111 = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(15)](III111IIlll1l1IlI1lIl[1], lIIlI1ll1IlllI111II1 - 32)
              return {0, lIlI1IIlllll1llI1Il111}
            end
          local IIIllI1II111I1Il1 = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(15)](III111IIlll1l1IlI1lIl[1], lIIlI1ll1IlllI111II1)
          local III1lI1lIIII1ll1ll1I1 = lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(12)](lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(15)](III111IIlll1l1IlI1lIl[2], lIIlI1ll1IlllI111II1), lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(14)](III111IIlll1l1IlI1lIl[1], 32 - lIIlI1ll1IlllI111II1))
          return {IIIllI1II111I1Il1, III1lI1lIIII1ll1ll1I1}
        end
      local function l11Il1I1II1l11I1II1Il(IIll1l1I1lllIIlI11I1ll, l1111I1I1l1ll1Il1IIlI)
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(10)](IIll1l1I1lllIIlI11I1ll, l1111I1I1l1ll1Il1IIlI)
        end
      local function II1IlIlIl11lI11lll1I(l1Il1IIl1111IIIIlIl1, IIlIllIIIllI11Il1lI11)
          local l11I1IIIl1Illl1III11I = 73
          l11I1IIIl1Illl1III11I = 73
          if 1 == 0 then
              local IIlIl1IllIIIl1Ill1Illl
            end
          do
              l11I1IIIl1Illl1III11I = l11I1IIIl1Illl1III11I
            end
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(11)](l1Il1IIl1111IIIIlIl1, IIlIllIIIllI11Il1lI11)
        end
      local function II11IlI11lllIl1llIl1I(lIll111l1I111IllII1l1, IIIl1II1I1lI111llII1I)
          local lIllI1111I1IIl1IlllIII = 456
          lIllI1111I1IIl1IlllIII = 456
          if 1 == 0 then
              local IIllI1l1l1l1Il1lllll1l
            end
          do
              lIllI1111I1IIl1IlllIII = lIllI1111I1IIl1IlllIII
            end
          local l1I11I1Ill111IlIl1IIl = 914
          l1I11I1Ill111IlIl1IIl = 914
          if 1 == 0 then
              local IIlIlIlII1I1lll1Il11l
            end
          do
              l1I11I1Ill111IlIl1IIl = l1I11I1Ill111IlIl1IIl
            end
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(12)](lIll111l1I111IllII1l1, IIIl1II1I1lI111llII1I)
        end
      local function IIII111ll111I11Illl1l(l111I1l1IIIIIIIIII11I)
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(13)](l111I1l1IIIIIIIIII11I)
        end
      local function I1I1ll11l1lllI111III1(I11I11IIll1II1111IIlI, lII11I1llI1I1III11lII)
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(14)](I11I11IIll1II1111IIlI, lII11I1llI1I1III11lII)
        end
      local function l1IIl11ll1IIII1IIII1l(lI1ll1lI111II11, I1l1IIIl1111lIIlllll)
          return lIlIlIlI11Il1III1llII[I11lI1IlIIl1IlIll11I(15)](lI1ll1lI111II11, I1l1IIIl1111lIIlllll)
        end
      local II1l1lIIll1lIlIIIIl1I = {206, 35, 106}
      local IIlIlIIIIl1IIlIl1111Il = lIIlIIIl11lI1III11III(0)
      for lII11II1lll1lIIlllI1l = 1, #II1l1lIIll1lIlIIIIl1I do
          local l1Il1l1llI1lll1l11llI = II1l1lIIll1lIlIIIIl1I[lII11II1lll1lIIlllI1l]
          local lIIIl1IlI1l1I1I1lI1l1 = lIIlIIIl11lI1III11III(l1Il1l1llI1lll1l11llI)
          IIlIlIIIIl1IIlIl1111Il = IIllllI1I1I11l1IlI1lI(I1l111II1ll1I1ll1lllI(IIlIlIIIIl1IIlIl1111Il, lIIIl1IlI1l1I1I1lI1l1), I11I111lll1ll1I1l11l(lIlII11lIllIIIll1llll1(lIIIl1IlI1l1I1I1lI1l1, (lII11II1lll1lIIlllI1l - 1) % 3), lIIlIIIl11lI1III11III(0xff)))
          IIlIlIIIIl1IIlIl1111Il = I11I111lll1ll1I1l11l(IIlIlIIIIl1IIlIl1111Il, lIIlIIIl11lI1III11III(0xff))
        end
      IIlIlIIIIl1IIlIl1111Il = IIl1l1Il1IIllIIlIlIl(I1l111II1ll1I1ll1lllI(IIlIlIIIIl1IIlIl1111Il, lIIlIIIl11lI1III11III(55 + 5)))
      local IIllll1IlIl1IIll11I1 = {26, 18, 4, 2, 3, 50, 39, 20, 30, 97, 98, 89, 84, 67, 109, 115, 124, 100, 103, 128, 158, 180, 158, 160, 138, 152, 166, 163, 204, 238, 219, 222, 243, 235, 250, 249, 237, 2, 40, 25}
      local lI1Ill1IIlI1II1llll1I = ((185 + 162 + IIlIlIIIIl1IIlIl1111Il) % 255) + 1
      local lIlI1I1l1l1lIIIll1llll = {}
      for l1llllIIlIlIII1lIll = 1, #IIllll1IlIl1IIll11I1 do
          local lI111llIIl1II1ll11llI = (lI1Ill1IIlI1II1llll1I + (l1llllIIlIlIII1lIll - 1) * 7) % 255
          lIlI1I1l1l1lIIIll1llll[l1llllIIlIlIII1lIll] = l11Il1I1II1l11I1II1Il(IIllll1IlIl1IIll11I1[l1llllIIlIlIII1lIll], lI111llIIl1II1ll11llI)
        end
      local IIlll11lIllI1IIl1ll1I1 = lIlI1I1l1l1lIIIll1llll[(9 - 8)]
      local I111II1lI1llI1llI1lI1 = lIlI1I1l1l1lIIIll1llll[(3 - 1)]
      local l11I11Il1l1II111I1I1l = lIlI1I1l1l1lIIIll1llll[(9 - 6)]
      local lIIIlll1IlIlIl1I1lI = lIlI1I1l1l1lIIIll1llll[(11 - 7)]
      local I1IIlI1lI111l1111lI1l = lIlI1I1l1l1lIIIll1llll[(12 - 7)]
      local lII11l1IIII1Il1lI1l = lIlI1I1l1l1lIIIll1llll[(12 - 6)]
      local l1lllIlIIIlI1l1llIlIl = lIlI1I1l1l1lIIIll1llll[(14 - 7)]
      local I1IIllIIlll111ll1l1l1 = lIlI1I1l1l1lIIIll1llll[(10 - 2)]
      local IIllIl1lllIl11I1I111ll = lIlI1I1l1l1lIIIll1llll[(14 - 5)]
      local lIIl1lI1llI1l1III111 = lIlI1I1l1l1lIIIll1llll[(17 - 7)]
      local lIlII1IlIIII1II1Il1lll = lIlI1I1l1l1lIIIll1llll[(18 - 7)]
      local I11I11IIIl1IIIlI1ll = lIlI1I1l1l1lIIIll1llll[(18 - 6)]
      local I1l1llIlll1Ill1IIl11 = lIlI1I1l1l1lIIIll1llll[(22 - 9)]
      local lIll11Il1II111IlI11I1I = lIlI1I1l1l1lIIIll1llll[(22 - 8)]
      local III1ll11Ill1ll1ll1I1l = lIlI1I1l1l1lIIIll1llll[(18 - 3)]
      local lI11IIl11Il11IIlll1l1 = lIlI1I1l1l1lIIIll1llll[(25 - 9)]
      local I11I1lI11I1l11lI1 = lIlI1I1l1l1lIIIll1llll[(23 - 6)]
      local l11lll111l1IlII11I1I = lIlI1I1l1l1lIIIll1llll[(26 - 8)]
      local lI1l1I1I1lIllII1Il1l = lIlI1I1l1l1lIIIll1llll[(20 - 1)]
      local I1l1I111lII11llllIIlI = lIlI1I1l1l1lIIIll1llll[(26 - 6)]
      local I1I1llI1l1IIllIl1I11l = lIlI1I1l1l1lIIIll1llll[(25 - 4)]
      local I111lI1lII1l1I1lII11 = lIlI1I1l1l1lIIIll1llll[(26 - 4)]
      local IIIIlI1II1IIl1IllIIIl = lIlI1I1l1l1lIIIll1llll[(28 - 5)]
      local lIlII1l11ll1lII111III1 = lIlI1I1l1l1lIIIll1llll[(30 - 6)]
      local lI1lI1lllII1ll1llI = lIlI1I1l1l1lIIIll1llll[(29 - 4)]
      local I11IIl11llIllIlIlll1I = lIlI1I1l1l1lIIIll1llll[(29 - 3)]
      local IIIII1lll1Ill1lll1llI = lIlI1I1l1l1lIIIll1llll[(30 - 3)]
      local lI1I1111l11lI1IIlIIIl = lIlI1I1l1l1lIIIll1llll[(35 - 7)]
      local IIlI11ll1IIIllIl111l1 = lIlI1I1l1l1lIIIll1llll[(38 - 9)]
      local I1IllIlI1IllIlIIlIIlI = lIlI1I1l1l1lIIIll1llll[(32 - 2)]
      local I11Ill1Ill11l11l1Ill1 = lIlI1I1l1l1lIIIll1llll[(32 - 1)]
      local lIll1ll1l1lI111Ill1I1I = lIlI1I1l1l1lIIIll1llll[(38 - 6)]
      local lIIIl111l1Il1II1ll1l = lIlI1I1l1l1lIIIll1llll[(39 - 6)]
      local IIllI1IIl1ll1IIIIl11 = lIlI1I1l1l1lIIIll1llll[(37 - 3)]
      local l1I1l111l1IIII1l1II11 = lIlI1I1l1l1lIIIll1llll[(39 - 4)]
      local l11lI11111lI1Ill1II1l = lIlI1I1l1l1lIIIll1llll[(40 - 4)]
      local II1IIl1lIIlI1l111lI1I = lIlI1I1l1l1lIIIll1llll[(43 - 6)]
      local I1l1lIlll1ll1IIIll1I = lIlI1I1l1l1lIIIll1llll[(39 - 1)]
      local lIllI1III1I11IlI11I1I1 = lIlI1I1l1l1lIIIll1llll[(45 - 6)]
      local I11IIIIIIII1lllIllIl1 = lIlI1I1l1l1lIIIll1llll[(41 - 1)]
      local I11lIl1I1IlIlIlI1llI = {149, 139}
      local lIll1l1l1lIl1IllIIlII = ((l11Il1I1II1l11I1II1Il(76, 32) + IIlIlIIIIl1IIlIl1111Il) % 255) + 1
      local lII11llI11l1llllI1IIl = {}
      for I111lllIlIIl1IIIll1l1 = 1, #I11lIl1I1IlIlIlI1llI do
          local II1ll1ll111lIll11Il11 = (lIll1l1l1lIl1IllIIlII + (I111lllIlIIl1IIIll1l1 - 1) * 13) % 255
          lII11llI11l1llllI1IIl[I111lllIlIIl1IIIll1l1] = l11Il1I1II1l11I1II1Il(I11lIl1I1IlIlIlI1llI[I111lllIlIIl1IIIll1l1], II1ll1ll111lIll11Il11)
        end
      local I1lIll1IIlII1lIlIllII = #lII11llI11l1llllI1IIl
      local I1llIIl11Illl1IlI1I1I = {{4, I11lI1IlIIl1IlIll11I(16)}, {4, I11lI1IlIIl1IlIll11I(17)}, {4, I11lI1IlIIl1IlIll11I(18)}, {0, I11lI1IlIIl1IlIll11I(19)}, {3, I11lI1IlIIl1IlIll11I(20)}}
      local l1II1llI1Il11l1llI1I1 = {144, 198, 208, 135, 220, 113, 195, 67, 179, 238, 25, 35, 23}
      local l1lIIlIl1lIl1l11111II = {}
      local l111I11IIllI1I1I1lllI = {}
      local I111l11l1lIlllII1IIlI = {}
      local lI1Il11l1I111Il11lI1l = ((l11Il1I1II1l11I1II1Il(25, 78) + IIlIlIIIIl1IIlIl1111Il) % 255) + 1
      for lII11lI1IIIl1ll1l1l11 = 1, #l1II1llI1Il11l1llI1I1 do
          local IIll1lI111IlI111l11l1l = (lI1Il11l1I111Il11lI1l + (lII11lI1IIIl1ll1l1l11 - 1) * 11) % 255
          l1lIIlIl1lIl1l11111II[lII11lI1IIIl1ll1l1l11] = l11Il1I1II1l11I1II1Il(l1II1llI1Il11l1llI1I1[lII11lI1IIIl1ll1l1l11], IIll1lI111IlI111l11l1l)
        end
      local l1I11l11IIl1III11IlIl = #l1lIIlIl1lIl1l11111II
      local III1I1Il1l1ll1IlIlIl1 = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(21)]
      local function l1lII11IIlIIIIII1lIlI(IIllIl1ll1lIl1llIlI1l)
          if I111l11l1lIlllII1IIlI[IIllIl1ll1lIl1llIlI1l] then
              return l111I11IIllI1I1I1lllI[IIllIl1ll1lIl1llIlI1l]
            end
          I111l11l1lIlllII1IIlI[IIllIl1ll1lIl1llIlI1l] = true
          local IIIlIIIll1llIllIlIlIl = I1llIIl11Illl1IlI1I1I[IIllIl1ll1lIl1llIlI1l]
          if not IIIlIIIll1llIllIlIlIl then
              return nil
            end
          local l1I1IIl1l11Il11llIIII = IIIlIIIll1llIllIlIlIl[1]
          local I1llIllII11lllI1l111I = IIIlIIIll1llIllIlIlIl[2]
          local II1IllIII1II1l1I11lI1 = {}
          for IIll1IIlIlIlIl11lIlIII = 1, #I1llIllII11lllI1l111I do
              local lI11I1II1llIlIIl = (IIll1IIlIlIlIl11lIlIII - 1) % l1I11l11IIl1III11IlIl + 1
              local lIlI1II1ll1I1I1l1I111l = III1I1Il1l1ll1IlIlIl1(I1llIllII11lllI1l111I, IIll1IIlIlIlIl11lIlIII) - l1lIIlIl1lIl1l11111II[lI11I1II1llIlIIl]
              if lIlI1II1ll1I1I1l1I111l < 0 then
                  lIlI1II1ll1I1I1l1I111l = lIlI1II1ll1I1I1l1I111l + 256
                end
              II1IllIII1II1l1I11lI1[IIll1IIlIlIlIl11lIlIII] = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](lIlI1II1ll1I1I1l1I111l)
            end
          local lII111I1I1l1lIl1Ill11 = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(2)][I11lI1IlIIl1IlIll11I(7)](II1IllIII1II1l1I11lI1)
          local l1l11lI1IlIlIl1lIIIll
          if l1I1IIl1l11Il11llIIII == 0 then
              l1l11lI1IlIlIl1lIIIll = nil
      elseif l1I1IIl1l11Il11llIIII == 1 then
              l1l11lI1IlIlIl1lIIIll = false
      elseif l1I1IIl1l11Il11llIIII == 2 then
              l1l11lI1IlIlIl1lIIIll = true
      elseif l1I1IIl1l11Il11llIIII == 3 then
              l1l11lI1IlIlIl1lIIIll = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(22)](lII111I1I1l1lIl1Ill11)
            else
              l1l11lI1IlIlIl1lIIIll = lII111I1I1l1lIl1Ill11
            end
          l111I11IIllI1I1I1lllI[IIllIl1ll1lIl1llIlI1l] = l1l11lI1IlIlIl1lIIIll
          return l1l11lI1IlIlIl1lIIIll
        end
      local lIl1lll111lll1IIIlIlI = {IIlIllllll1lI1I1l1lI, II1I11IIl1I1lIII1IIll}
      local IIllI11IIl1l1IllII11lI = {}
      local lIll1lI11llIl11l111l1I = 0
      local l1lIlI1l1Il1I1I11lll
      local l111l11IIl11IlIl1l1 = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(5)]
      if l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(6)](l111l11IIl11IlIl1l1) == I11lI1IlIIl1IlIll11I(1) then
          l1lIlI1l1Il1I1I11lll = l111l11IIl11IlIl1l1(1)
        end
      if l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(6)](l1lIlI1l1Il1I1I11lll) ~= I11lI1IlIIl1IlIll11I(2) then
          l1lIlI1l1Il1I1I11lll = _G
        end
      local l1l1IlIllI1l1ll1IIl = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(2)][I11lI1IlIIl1IlIll11I(23)]
      local II1l111I11llll111ll11 = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(2)][I11lI1IlIIl1IlIll11I(24)]
      local lIlIII1IIIllIIlll1III = {l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](80, 223, 240, 1, 134, 35, 52, 69, 195, 103, 120, 137, 21, 171, 188, 205, 88, 239, 0, 17, 166, 51, 68, 85, 239, 119, 136, 153, 63, 187, 204, 221, 123, 255, 16, 33, 162, 67, 84, 101, 241, 135, 152, 169, 62, 203, 220, 237, 103, 15, 32, 49, 215, 83, 100, 117, 19, 151, 168, 185) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](104, 219, 236, 253, 138, 31, 48, 65, 214, 99, 116, 133, 25, 167, 184, 201, 78, 235, 252, 13, 139, 47, 64, 81, 237, 115, 132, 149, 33, 183, 200, 217, 110, 251, 12, 29, 172, 63, 80, 97, 231, 131, 148, 165, 35, 199, 216, 233, 88, 11, 28, 45, 186, 79, 96, 113, 6, 147, 164, 181) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](73, 215, 232, 249, 157, 27, 44, 61, 219, 95, 112, 129, 29, 163, 180, 197, 83, 231, 248, 9, 158, 43, 60, 77, 192, 111, 128, 145, 53, 179, 196, 213, 115, 247, 8, 25, 168, 59, 76, 93, 234, 127, 144, 161, 54, 195, 212, 229, 116, 7, 24, 41, 175, 75, 92, 109, 235, 143, 160, 177) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](82, 211, 228, 245, 134, 23, 40, 57, 206, 91, 108, 125, 5, 159, 176, 193, 68, 227, 244, 5, 131, 39, 56, 73, 213, 107, 124, 141, 30, 175, 192, 209, 102, 243, 4, 21, 178, 55, 72, 89, 254, 123, 140, 157, 56, 191, 208, 225, 98, 3, 20, 37, 181, 71, 88, 105, 254, 139, 156, 173) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](63, 207, 224, 241, 145, 19, 36, 53, 211, 87, 104, 121, 26, 155, 172, 189, 79, 223, 240, 1, 150, 35, 52, 69, 200, 103, 120, 137, 10, 171, 188, 205, 75, 239, 0, 17, 173, 51, 68, 85, 228, 119, 136, 153, 46, 187, 204, 221, 112, 255, 16, 33, 160, 67, 84, 101, 227, 135, 152, 169) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](63, 203, 220, 237, 120, 15, 32, 49, 196, 83, 100, 117, 7, 151, 168, 185, 86, 219, 236, 253, 155, 31, 48, 65, 194, 99, 116, 133, 26, 167, 184, 201, 94, 235, 252, 13, 128, 47, 64, 81, 255, 115, 132, 149, 51, 183, 200, 217, 116, 251, 12, 29, 174, 63, 80, 97, 246, 131, 148, 165) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](11, 199, 216, 233, 111, 11, 28, 45, 171, 79, 96, 113, 11, 147, 164, 181, 107, 215, 232, 249, 142, 27, 44, 61, 250, 95, 112, 129, 7, 163, 180, 197, 67, 231, 248, 9, 149, 43, 60, 77, 210, 111, 128, 145, 38, 179, 196, 213, 103, 247, 8, 25, 184, 59, 76, 93, 251, 127, 144, 161), l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](61, 195, 212, 229, 113, 7, 24, 41, 190, 75, 92, 109, 224, 143, 160, 177, 94, 211, 228, 245, 147, 23, 40, 57, 210, 91, 108, 125, 10, 159, 176, 193, 86, 227, 244, 5, 151, 39, 56, 73, 204, 107, 124, 141, 11, 175, 192, 209, 104, 243, 4, 21, 181, 55, 72, 89, 238, 123, 140, 157) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](26, 191, 208, 225, 103, 3, 20, 37, 163, 71, 88, 105, 245, 139, 156, 173, 57, 207, 224, 241, 134, 19, 36, 53, 201, 87, 104, 121, 26, 155, 172, 189, 91, 223, 240, 1, 180, 35, 52, 69, 210, 103, 120, 137, 30, 171, 188, 205, 82, 239, 0, 17, 131, 51, 68, 85, 243, 119, 136, 153) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](15, 187, 204, 221, 106, 255, 16, 33, 182, 67, 84, 101, 232, 135, 152, 169, 43, 203, 220, 237, 107, 15, 32, 49, 220, 83, 100, 117, 0, 151, 168, 185, 78, 219, 236, 253, 190, 31, 48, 65, 199, 99, 116, 133, 3, 167, 184, 201, 65, 235, 252, 13, 155, 47, 64, 81, 230, 115, 132, 149) .. l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(3)](61, 183, 200, 217, 74, 251, 12, 29, 187, 63, 80, 97, 215, 131, 148, 165, 50, 199, 216, 233, 126, 11, 28, 45, 160, 79, 96, 113, 20, 147, 164, 181, 83, 215, 232, 249, 145, 27, 44, 61, 203, 95, 112, 129, 22, 163, 180, 197, 92, 231, 248, 9, 143, 43, 60, 77, 203, 111, 128, 145)}
      local IIII1lII1I1IIl1ll = {1, 2}
      local I1II1lIIIl11lI1IlIIlI = {}
      for II1ll111ll1ll1IllI = 1, #IIII1lII1I1IIl1ll do
          I1II1lIIIl11lI1IlIIlI[II1ll111ll1ll1IllI] = lIlIII1IIIllIIlll1III[IIII1lII1I1IIl1ll[II1ll111ll1ll1IllI]]
        end
      local II111111Il1l111III1l1 = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(2)][I11lI1IlIIl1IlIll11I(7)](I1II1lIIIl11lI1IlIIlI)
      local I1l11l1ll1lI1IlIIIlI = ((11 + 31 + IIlIlIIIIl1IIlIl1111Il) % 255) + 1
      local l1IlllIIIlIIl1I111II = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(4)][I11lI1IlIIl1IlIll11I(21)]
      local function IIl1llllIIl1lllll1l1l1(lIllIIlIIIIlIII1lII1l1)
          local IIll1lI111lIII1llllll1 = l1IlllIIIlIIl1I111II(II111111Il1l111III1l1, lIllIIlIIIIlIII1lII1l1)
          local lIlI1l1IIIIIll1l1I1I1 = (I1l11l1ll1lI1IlIIIlI + (lIllIIlIIIIlIII1lII1l1 - 1) * 17) % 256
          return l11Il1I1II1l11I1II1Il(IIll1lI111lIII1llllll1, lIlI1l1IIIIIll1l1I1I1)
        end
      local function II11llIlIIlI1lIII1I1l(III1IlIIIlllll11llI1l)
          local I11l1IIIIllI1Il11111l = IIl1llllIIl1lllll1l1l1(III1IlIIIlllll11llI1l)
          local IIIII11111I1IlI1lllII = IIl1llllIIl1lllll1l1l1(III1IlIIIlllll11llI1l + 1)
          local lIl1lIlI11I1l1lIll1I1 = IIl1llllIIl1lllll1l1l1(III1IlIIIlllll11llI1l + 2)
          local I11IlI1III1l1I1llI1 = IIl1llllIIl1lllll1l1l1(III1IlIIIlllll11llI1l + 3)
          return I11l1IIIIllI1Il11111l + IIIII11111I1IlI1lllII * 256 + lIl1lIlI11I1l1lIll1I1 * 65536 + I11IlI1III1l1I1llI1 * 16777216
        end
      local function lIlIIl1lII1lII1II1IlIl(l1I1llIIIlIlIIl111ll1)
          local l1l1lIllII1lI1lII1III = 978
          l1l1lIllII1lI1lII1III = 978
          if 1 == 0 then
              local lIII11lIll1IlllII1I
            end
          do
              l1l1lIllII1lI1lII1III = l1l1lIllII1lI1lII1III
            end
          local I11Il1lllIllllIll1llI = 103
          I11Il1lllIllllIll1llI = 103
          if 1 == 0 then
              local II1Il1IlI1IIlIl1llIl1
            end
          do
              I11Il1lllIllllIll1llI = I11Il1lllIllllIll1llI
            end
          local I1I1lIIIIIIIl11lI1I11 = (l1I1llIIIlIlIIl111ll1 - 1) * 12 + 1
          local lIl11IIIIIlll1IlIlII1 = II11llIlIIlI1lIII1I1l(I1I1lIIIIIIIl11lI1I11)
          local lIllIl1I11Ill11Il1IllI = II11llIlIIlI1lIII1I1l(I1I1lIIIIIIIl11lI1I11 + 4)
          local IIlIlIIllI1lIIllIIlI1 = II11llIlIIlI1lIII1I1l(I1I1lIIIIIIIl11lI1I11 + 8)
          return lIl11IIIIIlll1IlIlII1, lIllIl1I11Ill11Il1IllI, IIlIlIIllI1lIIllIIlI1
        end
      local II1lIl1llIIlIlI1IIl1 = 1
      while true do
          local I1lIIll1l11llIIII1l1l, l11II11I1lIl11lI1I1I1, lIllII111lll1III11lIlI = lIlIIl1lII1lII1II1IlIl(II1lIl1llIIlIlI1IIl1)
          local II1Il1IlI1I111l11IlIl = 0
          if I1lIll1IIlII1lIlIllII > 0 then
              local IIllllIlI1llIl1Ill11ll = ((II1lIl1llIIlIlI1IIl1 + IIlIlIIIIl1IIlIl1111Il - 1) % I1lIll1IIlII1lIlIllII) + 1
              II1Il1IlI1I111l11IlIl = lII11llI11l1llllI1IIl[IIllllIlI1llIl1Ill11ll]
              I1lIIll1l11llIIII1l1l = l11Il1I1II1l11I1II1Il(I1lIIll1l11llIIII1l1l, II1Il1IlI1I111l11IlIl)
              l11II11I1lIl11lI1I1I1 = l11Il1I1II1l11I1II1Il(l11II11I1lIl11lI1I1I1, II1Il1IlI1I111l11IlIl)
              lIllII111lll1III11lIlI = l11Il1I1II1l11I1II1Il(lIllII111lll1III11lIlI, II1Il1IlI1I111l11IlIl)
            end
          if I1lIIll1l11llIIII1l1l == IIlll11lIllI1IIl1ll1I1 then
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I111II1lI1llI1llI1lI1 then
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = l1lII11IIlIIIIII1lIlI(l11II11I1lIl11lI1I1I1)
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == l11I11Il1l1II111I1I1l then
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = lIl1lll111lll1IIIlIlI[l11II11I1lIl11lI1I1I1]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIIIlll1IlIlIl1I1lI then
              lIl1lll111lll1IIIlIlI[l11II11I1lIl11lI1I1I1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1IIlI1lI111l1111lI1l then
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = l1lIlI1l1Il1I1I11lll[l1lII11IIlIIIIII1lIlI(l11II11I1lIl11lI1I1I1)]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lII11l1IIII1Il1lI1l then
              l1lIlI1l1Il1I1I11lll[l1lII11IIlIIIIII1lIlI(l11II11I1lIl11lI1I1I1)] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == l1lllIlIIIlI1l1llIlIl then
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = {}
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1IIllIIlll111ll1l1l1 then
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == IIllIl1lllIl11I1I111ll then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIIl1lI1llI1l1III111 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIlII1IlIIII1II1Il1lll then
              local lI111I11l1l1ll1ll111l = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              local lIlIl11lI1l1ll11l1l111 = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = lIlIl11lI1l1ll11l1l111[lI111I11l1l1ll1ll111l]
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I11I11IIIl1IIIlI1ll then
              local IIll1lI11II1l1lIlI1llI = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              local IIlIIII11Il1I1l1l11l = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = nil
              local lIlllIlIlIIl1I11II11II = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 2]
              lIlllIlIlIIl1I11II11II[IIlIIII11Il1I1l1l11l] = IIll1lI11II1l1lIlI1llI
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 2] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 3
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1l1llIlll1Ill1IIl11 then
              local IIlIIllII1llI1I1lIII11 = l11II11I1lIl11lI1I1I1
              local IIllll1IIIIlII11I1I1lI = lIllII111lll1III11lIlI
              local l1IIIlIIIllllIl1lIIll = lIll1lI11llIl11l111l1I - IIlIIllII1llI1I1lIII11
              local lIlll111I1111l111lIl1 = IIllI11IIl1l1IllII11lI[l1IIIlIIIllllIl1lIIll]
              if IIllll1IIIIlII11I1I1lI == 0 then
                  lIlll111I1111l111lIl1(II1l111I11llll111ll11(IIllI11IIl1l1IllII11lI, l1IIIlIIIllllIl1lIIll + 1, lIll1lI11llIl11l111l1I))
                  for IIlllI1II1lIII1I1111Il = lIll1lI11llIl11l111l1I, l1IIIlIIIllllIl1lIIll, -1 do
                      IIllI11IIl1l1IllII11lI[IIlllI1II1lIII1I1111Il] = nil
                    end
                  lIll1lI11llIl11l111l1I = l1IIIlIIIllllIl1lIIll - 1
                else
                  local I1l1IIllIl1I111I1ll1 = l1l1IlIllI1l1ll1IIl(lIlll111I1111l111lIl1(II1l111I11llll111ll11(IIllI11IIl1l1IllII11lI, l1IIIlIIIllllIl1lIIll + 1, lIll1lI11llIl11l111l1I)))
                  for IIll111llIIll11l1I1ll1 = lIll1lI11llIl11l111l1I, l1IIIlIIIllllIl1lIIll, -1 do
                      IIllI11IIl1l1IllII11lI[IIll111llIIll11l1I1ll1] = nil
                    end
                  lIll1lI11llIl11l111l1I = l1IIIlIIIllllIl1lIIll - 1
                  if IIllll1IIIIlII11I1I1lI == 1 then
                      lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
                      IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = I1l1IIllIl1I111I1ll1[1]
                    else
                      for l11IIIIIllll1IIIl1II1 = 1, IIllll1IIIIlII11I1I1lI do
                          lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I + 1
                          IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = I1l1IIllIl1I111I1ll1[l11IIIIIllll1IIIl1II1]
                        end
                    end
                end
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIll11Il1II111IlI11I1I then
              local lIlI11l1ll1IIllIIlIIlI = l11II11I1lIl11lI1I1I1
              if lIlI11l1ll1IIllIIlIIlI == 0 then
                  return
        elseif lIlI11l1ll1IIllIIlIIlI == 1 then
                  return IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
                else
                  local I11lIIl1I1111111III = lIll1lI11llIl11l111l1I - lIlI11l1ll1IIllIIlIIlI + 1
                  return II1l111I11llll111ll11(IIllI11IIl1l1IllII11lI, I11lIIl1I1111111III, lIll1lI11llIl11l111l1I)
                end
      elseif I1lIIll1l11llIIII1l1l == III1ll11Ill1ll1ll1I1l then
              II1lIl1llIIlIlI1IIl1 = l11II11I1lIl11lI1I1I1
      elseif I1lIIll1l11llIIII1l1l == lI11IIl11Il11IIlll1l1 then
              if not IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] then
                  II1lIl1llIIlIlI1IIl1 = l11II11I1lIl11lI1I1I1
                else
                  II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
                end
      elseif I1lIIll1l11llIIII1l1l == I11I1lI11I1l11lI1 then
              if IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] then
                  II1lIl1llIIlIlI1IIl1 = l11II11I1lIl11lI1I1I1
                else
                  II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
                end
      elseif I1lIIll1l11llIIII1l1l == l11lll111l1IlII11I1I then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] + IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lI1l1I1I1lIllII1Il1l then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] - IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1l1I111lII11llllIIlI then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] * IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1I1llI1l1IIllIl1I11l then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] / IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I111lI1lII1l1I1lII11 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(9)][I11lI1IlIIl1IlIll11I(8)](IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] / IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == IIIIlI1II1IIl1IllIIIl then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] % IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIlII1l11ll1lII111III1 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] ^ IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lI1lI1lllII1ll1llI then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] .. IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I11IIl11llIllIlIlll1I then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] == IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == IIIII1lll1Ill1lll1llI then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] ~= IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lI1I1111l11lI1IIlIIIl then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] < IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == IIlI11ll1IIIllIl111l1 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] <= IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1IllIlI1IllIlIIlIIlI then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] > IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I11Ill1Ill11l11l1Ill1 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] >= IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIll1ll1l1lI111Ill1I1I then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = II1IlIlIl11lI11lll1I(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIIIl111l1Il1II1ll1l then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = II11IlI11lllIl1llIl1I(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == IIllI1IIl1ll1IIIIl11 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = l11Il1I1II1l11I1II1Il(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == l1I1l111l1IIII1l1II11 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = I1I1ll11l1lllI111III1(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == l11lI11111lI1Ill1II1l then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1] = l1IIl11ll1IIII1IIII1l(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I - 1], IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = nil
              lIll1lI11llIl11l111l1I = lIll1lI11llIl11l111l1I - 1
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == II1IIl1lIIlI1l111lI1I then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = -IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I1l1lIlll1ll1IIIll1I then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = not IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == lIllI1III1I11IlI11I1I1 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = #IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I]
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
      elseif I1lIIll1l11llIIII1l1l == I11IIIIIIII1lllIllIl1 then
              IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I] = IIII111ll111I11Illl1l(IIllI11IIl1l1IllII11lI[lIll1lI11llIl11l111l1I])
              II1lIl1llIIlIlI1IIl1 = II1lIl1llIIlIlI1IIl1 + 1
            else
              return
            end
        end
    end
end
l1lll111IlIlllI1l1l1l[I11lI1IlIIl1IlIll11I(25)](lI1IIIllllI1I1IIIII11(2, 6))