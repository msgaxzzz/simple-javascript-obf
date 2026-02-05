do
  local function lIIll1II1lIIllI1I1l11(I1l1IIl1llI11IIll1IlI)
      error(I1l1IIl1llI11IIll1IlI, 0)
    end
  local IIlIIIlIIIl1ll111l1lIl = type
  if IIlIIIlIIIl1ll111l1lIl == nil then
      lIIll1II1lIIllI1I1l11("Integrity check failed")
    end
  local function lIlllIIl1I1Illll11l1l1()
      local lIlIl1Il1l1111I111II
      local I111IIllIIlI1ll1lIl = getfenv
      if IIlIIIlIIIl1ll111l1lIl(I111IIllIIlI1ll1lIl) == "function" then
          lIlIl1Il1l1111I111II = I111IIllIIlI1ll1lIl(1)
        end
      if IIlIIIlIIIl1ll111l1lIl(lIlIl1Il1l1111I111II) ~= "table" then
          lIlIl1Il1l1111I111II = _G
        end
      local lIlIIIllIIl11111I1I1Il = getmetatable
      if IIlIIIlIIIl1ll111l1lIl(lIlIIIllIIl11111I1I1Il) == "function" then
          local l1I11l1111l1l1I1I11ll = lIlIIIllIIl11111I1I1Il(lIlIl1Il1l1111I111II)
          if l1I11l1111l1l1I1I11ll ~= nil then
              local lIIl1Ill1IIIIlI1I1III = _G
              if IIlIIIlIIIl1ll111l1lIl(lIIl1Ill1IIIIlI1I1III) == "table" then
                  lIlIl1Il1l1111I111II = lIIl1Ill1IIIIlI1I1III
                end
            end
        end
      return lIlIl1Il1l1111I111II
    end
  local function IIllIl1lllIl1I11llIl1()
      local II1llI111l11I11I11I1I = lIlllIIl1I1Illll11l1l1()
      if IIlIIIlIIIl1ll111l1lIl(II1llI111l11I11I11I1I) ~= "table" then
          lIIll1II1lIIllI1I1l11("Integrity check failed")
        end
      local l111ll1I1I11lIIll1ll1 = debug
      if IIlIIIlIIIl1ll111l1lIl(l111ll1I1I11lIIll1ll1) == "table" then
          local I11l1IIIIIIlllI1l11I1 = l111ll1I1I11lIIll1ll1.lI1l11IIIlIlll1l11lI1
          if IIlIIIlIIIl1ll111l1lIl(I11l1IIIIIIlllI1l11I1) == "function" then
              local I1IIl1II1lllIl1I1IIll, IIlIIIll1lI1II1l1IlII = pcall(I11l1IIIIIIlllI1l11I1)
              if I1IIl1II1lllIl1I1IIll and IIlIIIll1lI1II1l1IlII ~= nil then
                  lIIll1II1lIIllI1I1l11("Integrity check failed")
                end
            end
        end
      local I1I1l11Illll1I1IlIl = getmetatable
      if IIlIIIlIIIl1ll111l1lIl(I1I1l11Illll1I1IlIl) == "function" then
          local IIIl1111I11II1llIl1Il = I1I1l11Illll1I1IlIl(II1llI111l11I11I11I1I)
          if IIIl1111I11II1llIl1Il ~= nil then
              lIIll1II1lIIllI1I1l11("Integrity check failed")
            end
        end
    end
  IIllIl1lllIl1I11llIl1()
  local lII1Ill1lII111IlIIIll = false
  if lII1Ill1lII111IlIIIll then
      local lI1l1I1lIIIlIll11I1Il = setmetatable
      if IIlIIIlIIIl1ll111l1lIl(lI1l1I1lIIIlIll11I1Il) == "function" then
          local l11lllI1111IllIIlIl1l = lIlllIIl1I1Illll11l1l1()
          local l1lIlIIl1ll11lllllIlI = getmetatable(l11lllI1111IllIIlIl1l)
          if l1lIlIIl1ll11lllllIlI == nil then
              l1lIlIIl1ll11lllllIlI = {}
              lI1l1I1lIIIlIll11I1Il(l11lllI1111IllIIlIl1l, l1lIlIIl1ll11lllllIlI)
            end
          if l1lIlIIl1ll11lllllIlI.l11I1lIIIlll1I1II1II1 == nil then
              l1lIlIIl1ll11lllllIlI.l11I1lIIIlll1I1II1II1 = "locked"
            end
          if l1lIlIIl1ll11lllllIlI.lI11l11Il1I11I1Il == nil then
              l1lIlIIl1ll11lllllIlI.lI11l11Il1I11I1Il = function()
  error("Runtime integrity violation", 0)
end
            end
        end
    end
end
local lIll1IIIIIII1I11l11l1l = {{170, 103, 201, 235, 132, 83, 160, 76}, {184, 83, 189, 244, 117}, {167, 90, 188, 250}, {183, 102, 205, 241, 126, 81}, {171, 87, 207, 238, 117, 88, 167}, {184, 107, 203, 237}, {167, 97, 201, 235, 113, 94}, {170, 94, 202, 247, 130}, {177, 83, 207, 240}, {166, 106, 202, 250}, {166, 83, 201, 236}, {166, 97, 205}, {166, 96, 202, 252}, {176, 101, 195, 241, 118, 94}, {182, 101, 195, 241, 118, 94}, {21, 34, 140}, {17, 20, 143}, {31, 20, 134, 148, 119}, {}, {224, 227}, {166, 107, 207, 237}, {184, 97, 201, 253, 125, 76, 150, 80}, {180, 83, 190, 243}, {103}, {183, 87, 199, 237, 115, 94}, {178}, {185, 96, 203, 233, 115, 85}, {180, 100, 196, 246, 132}}
local lII11ll1lll1l11l1I11I = {68, 242, 91, 136, 16, 234, 49, 222, 126, 153, 41}
local lIlI1111I11lIlll1l1Ill = {}
local function lI1Il111IlIIll11IIlI(lII111I11I1lI1lIlIlI)
  local I1Il1IlIIlllIl1lll1l = 298
  I1Il1IlIIlllIl1lll1l = 298
  if 1 == 0 then
      local lI1lIII1111lll1IIIl1I
    end
  do
      I1Il1IlIIlllIl1lll1l = I1Il1IlIIlllIl1lll1l
    end
  local l1lllIlIII1lII1Il1 = lIlI1111I11lIlll1l1Ill[lII111I11I1lI1lIlIlI]
  if l1lllIlIII1lII1Il1 ~= nil then
      return l1lllIlIII1lII1Il1
    end
  local IIl1lI1IlIl11111lIlll = lIll1IIIIIII1I11l11l1l[lII111I11I1lI1lIlIlI]
  local lIlIlIIII1II1Illl1lIlI = {}
  local lIIl1Il1I11lllIl1I1 = #lII11ll1lll1l11l1I11I
  for I1I1I111llllll1I1IlII = 1, #IIl1lI1IlIl11111lIlll do
      local lIllII1IlII1lIllIl11lI = I1I1I111llllll1I1IlII - 1
      lIllII1IlII1lIllIl11lI = lIllII1IlII1lIllIl11lI % lIIl1Il1I11lllIl1I1
      lIllII1IlII1lIllIl11lI = lIllII1IlII1lIllIl11lI + 1
      local l1ll1IlIll111III11Il = IIl1lI1IlIl11111lIlll[I1I1I111llllll1I1IlII] - lII11ll1lll1l11l1I11I[lIllII1IlII1lIllIl11lI]
      if l1ll1IlIll111III11Il < 0 then
          l1ll1IlIll111III11Il = l1ll1IlIll111III11Il + 256
        end
      lIlIlIIII1II1Illl1lIlI[I1I1I111llllll1I1IlII] = string.char(l1ll1IlIll111III11Il)
    end
  local lII1ll1l1IIllI1l11l11 = table.concat(lIlIlIIII1II1Illl1lIlI)
  lIlI1111I11lIlll1l1Ill[lII111I11I1lI1lIlIlI] = lII1ll1l1IIllI1l11l11
  return lII1ll1l1IIllI1l11l11
end
local l1Il1IlIlIIl1l1111Ill = nil
local IIll1lIl1I1III111IIIII = getfenv
if type(IIll1lIl1I1III111IIIII) == lI1Il111IlIIll11IIlI(1) then
  l1Il1IlIlIIl1l1111Ill = IIll1lIl1I1III111IIIII(1)
end
if type(l1Il1IlIlIIl1l1111Ill) ~= lI1Il111IlIIll11IIlI(2) then
  l1Il1IlIlIIl1l1111Ill = _G
end
local function lIlIlllll1lI1Il1IIllI1(lI1I1lIII1III11l1l1ll, lI1ll11llll1l1IlIl)
  do
      local I1II1Il11II1IIlllI11I = 4294967296
      local I1IlllIlI11l1Ill11I1l
      do
          local I1l1IlI1llllllIIll1Il = 57
          local lIlIllI11IIIllIIll = {41, 48, 59, 250, 249}
          local lIlIllI1l1l1lI1IllI1l = {}
          for lIllIl1IlI1I111lIll1 = 1, #lIlIllI11IIIllIIll do
              lIlIllI1l1l1lI1IllI1l[lIllIl1IlI1I111lIll1] = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)]((lIlIllI11IIIllIIll[lIllIl1IlI1I111lIll1] + I1l1IlI1llllllIIll1Il) % 256)
            end
          local IIlI11lIIIlI1II1III1II
          local I11I1II1II1II11lIl1II = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(5)]
          if l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(6)](I11I1II1II1II11lIl1II) == lI1Il111IlIIll11IIlI(1) then
              IIlI11lIIIlI1II1III1II = I11I1II1II1II11lIl1II(1)
            end
          if l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(6)](IIlI11lIIIlI1II1III1II) ~= lI1Il111IlIIll11IIlI(2) then
              IIlI11lIIIlI1II1III1II = _G
            end
          I1IlllIlI11l1Ill11I1l = IIlI11lIIIlI1II1III1II[l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(2)][lI1Il111IlIIll11IIlI(7)](lIlIllI1l1l1lI1IllI1l)]
        end
      if I1IlllIlI11l1Ill11I1l == nil then
          local function III11Il1III1lI1I1lIlI(I1I1l111I1I1IlI1I111I)
              I1I1l111I1I1IlI1I111I = I1I1l111I1I1IlI1I111I % I1II1Il11II1IIlllI11I
              if I1I1l111I1I1IlI1I111I < 0 then
                  I1I1l111I1I1IlI1I111I = I1I1l111I1I1IlI1I111I + I1II1Il11II1IIlllI11I
                end
              return I1I1l111I1I1IlI1I111I
            end
          I1IlllIlI11l1Ill11I1l = {}
          function I1IlllIlI11l1Ill11I1l.IIlIIlI1I1lI1II11lIlI1(lIlI111l1l11lll1Illlll, IIlIl1I11IlllII11lIl11)
              lIlI111l1l11lll1Illlll = III11Il1III1lI1I1lIlI(lIlI111l1l11lll1Illlll)
              IIlIl1I11IlllII11lIl11 = III11Il1III1lI1I1lIlI(IIlIl1I11IlllII11lIl11)
              local lIlllII11I1ll111I1I1l1 = 0
              local I1111lIII1ll1I11I1lI1 = 1
              for IIll1llI1I1IIII1Il1Il1 = 0, 31 do
                  local l11l111I11lIlllIlllIl = lIlI111l1l11lll1Illlll % 2
                  local lIllllI11IlIIIIlIll1Il = IIlIl1I11IlllII11lIl11 % 2
                  if l11l111I11lIlllIlllIl == 1 and lIllllI11IlIIIIlIll1Il == 1 then
                      lIlllII11I1ll111I1I1l1 = lIlllII11I1ll111I1I1l1 + I1111lIII1ll1I11I1lI1
                    end
                  lIlI111l1l11lll1Illlll = (lIlI111l1l11lll1Illlll - l11l111I11lIlllIlllIl) / 2
                  IIlIl1I11IlllII11lIl11 = (IIlIl1I11IlllII11lIl11 - lIllllI11IlIIIIlIll1Il) / 2
                  I1111lIII1ll1I11I1lI1 = I1111lIII1ll1I11I1lI1 * 2
                end
              return lIlllII11I1ll111I1I1l1
            end
          function I1IlllIlI11l1Ill11I1l.I1l1I11IlllI1ll111Il(lIIl11I1lllI11lllIIII, lIllIIII11IlIl1I1IlI)
              lIIl11I1lllI11lllIIII = III11Il1III1lI1I1lIlI(lIIl11I1lllI11lllIIII)
              lIllIIII11IlIl1I1IlI = III11Il1III1lI1I1lIlI(lIllIIII11IlIl1I1IlI)
              local IIl1I1I1IlIIl1lllII11 = 0
              local I1l1lI1II11l11I1l1lIl = 1
              for IIIIlIllIII1Il1l111II = 0, 31 do
                  local l11111Ill1lIIIIIIIIlI = lIIl11I1lllI11lllIIII % 2
                  local lIlIl1lll1II11lIl1II = lIllIIII11IlIl1I1IlI % 2
                  if l11111Ill1lIIIIIIIIlI == 1 or lIlIl1lll1II11lIl1II == 1 then
                      IIl1I1I1IlIIl1lllII11 = IIl1I1I1IlIIl1lllII11 + I1l1lI1II11l11I1l1lIl
                    end
                  lIIl11I1lllI11lllIIII = (lIIl11I1lllI11lllIIII - l11111Ill1lIIIIIIIIlI) / 2
                  lIllIIII11IlIl1I1IlI = (lIllIIII11IlIl1I1IlI - lIlIl1lll1II11lIl1II) / 2
                  I1l1lI1II11l11I1l1lIl = I1l1lI1II11l11I1l1lIl * 2
                end
              return IIl1I1I1IlIIl1lllII11
            end
          function I1IlllIlI11l1Ill11I1l.l1IIIIIIl1I11l1l11Il(IIlIl11111lIIlI1IlIIl, II1I1lI1IIII11Il1l11l)
              IIlIl11111lIIlI1IlIIl = III11Il1III1lI1I1lIlI(IIlIl11111lIIlI1IlIIl)
              II1I1lI1IIII11Il1l11l = III11Il1III1lI1I1lIlI(II1I1lI1IIII11Il1l11l)
              local lIlI1l1llIl1lI1lII11 = 0
              local IIlIIl1IIIllIlIlll1l1 = 1
              for I1Il11111llII1llIlI1 = 0, 31 do
                  local IIllI1llIl1II1l11lIIlI = IIlIl11111lIIlI1IlIIl % 2
                  local IIlIIlll111111ll11lI1 = II1I1lI1IIII11Il1l11l % 2
                  if IIllI1llIl1II1l11lIIlI + IIlIIlll111111ll11lI1 == 1 then
                      lIlI1l1llIl1lI1lII11 = lIlI1l1llIl1lI1lII11 + IIlIIl1IIIllIlIlll1l1
                    end
                  IIlIl11111lIIlI1IlIIl = (IIlIl11111lIIlI1IlIIl - IIllI1llIl1II1l11lIIlI) / 2
                  II1I1lI1IIII11Il1l11l = (II1I1lI1IIII11Il1l11l - IIlIIlll111111ll11lI1) / 2
                  IIlIIl1IIIllIlIlll1l1 = IIlIIl1IIIllIlIlll1l1 * 2
                end
              return lIlI1l1llIl1lI1lII11
            end
          function I1IlllIlI11l1Ill11I1l.l1IIIII1I1I111Il1III(lIlllI11lIIIIIl1IllI11)
              local II1lI11lIIIlllIl1l1Il = 505
              II1lI11lIIIlllIl1l1Il = 505
              if 1 == 0 then
                  local IIlII1lIIIII111l1IlI11
                end
              do
                  II1lI11lIIIlllIl1l1Il = II1lI11lIIIlllIl1l1Il
                end
              return I1II1Il11II1IIlllI11I - 1 - III11Il1III1lI1I1lIlI(lIlllI11lIIIIIl1IllI11)
            end
          function I1IlllIlI11l1Ill11I1l.l1lI1lIllIII1IIlIII1(II1111IlllI11I1ll1lIl, II1l11I1I1IlIII1IIll1)
              II1l11I1I1IlIII1IIll1 = II1l11I1I1IlIII1IIll1 % 32
              return (III11Il1III1lI1I1lIlI(II1111IlllI11I1ll1lIl) * (2 ^ II1l11I1I1IlIII1IIll1)) % I1II1Il11II1IIlllI11I
            end
          function I1IlllIlI11l1Ill11I1l.III1l111IIIIllI1I1I1I(III1l11ll1IIl1llIl11l, l1III1lIl1III1I1l11ll)
              l1III1lIl1III1I1l11ll = l1III1lIl1III1I1l11ll % 32
              return l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(9)][lI1Il111IlIIll11IIlI(8)](III11Il1III1lI1I1lIlI(III1l11ll1IIl1llIl11l) / (2 ^ l1III1lIl1III1I1l11ll))
            end
        end
      local function I1111111I1I1ll1l11l(lI1I11I11l1l1IIIl1I11, lIllI1IlIllllIlI1IIIl)
          return {lI1I11I11l1l1IIIl1I11, lIllI1IlIllllIlI1IIIl}
        end
      local function lIlllIIIIl1IIl1l1Ill1l(lIlIIIII1lI1lIIl1IIIl)
          return {0, lIlIIIII1lI1lIIl1IIIl % I1II1Il11II1IIlllI11I}
        end
      local function I111I1lII1II1IllIll1(III1IIlI1IlI1lI11II1I)
          return III1IIlI1IlI1lI11II1I[2]
        end
      local function I11111l1l11l1IlllI1ll(lIlIII1Ill111l11lllI1l, IIll11l111lllIlIllI1Il)
          local IIIIlIl11lIll1Il1I1l1 = lIlIII1Ill111l11lllI1l[2] + IIll11l111lllIlIllI1Il[2]
          local IIllIlllII1I11IIIIIll = 0
          if IIIIlIl11lIll1Il1I1l1 >= I1II1Il11II1IIlllI11I then
              IIIIlIl11lIll1Il1I1l1 = IIIIlIl11lIll1Il1I1l1 - I1II1Il11II1IIlllI11I
              IIllIlllII1I11IIIIIll = 1
            end
          local l1l11IIl11IIIIlI1IllI = (lIlIII1Ill111l11lllI1l[1] + IIll11l111lllIlIllI1Il[1] + IIllIlllII1I11IIIIIll) % I1II1Il11II1IIlllI11I
          return {l1l11IIl11IIIIlI1IllI, IIIIlIl11lIll1Il1I1l1}
        end
      local function II11IIllIIlllllIlIIl(lI1lIlI1III1IlI11I1I, l1ll1II1ll11I1IlIlIl1)
          local IIIllII111I1I1I1lIIl = (lI1lIlI1III1IlI11I1I[1] % l1ll1II1ll11I1IlIlIl1) * (I1II1Il11II1IIlllI11I % l1ll1II1ll11I1IlIlIl1) + (lI1lIlI1III1IlI11I1I[2] % l1ll1II1ll11I1IlIlIl1)
          return IIIllII111I1I1I1lIIl % l1ll1II1ll11I1IlIlIl1
        end
      local function lIIl1Ill11I11II1II1Il(l1I1l11I1l1lI1ll11lll)
          local l1lIlIlIll1ll1IIIll1 = (l1I1l11I1l1lI1ll11lll[1] % 255) + (l1I1l11I1l1lI1ll11lll[2] % 255)
          return l1lIlIlIll1ll1IIIll1 % 255
        end
      local function IIlIl1I1l1lll11lll1llI(l1lIII1IIlIll1lIIllI1, I11IlI1lII1lI1lll11)
          return {I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(10)](l1lIII1IIlIll1lIIllI1[1], I11IlI1lII1lI1lll11[1]), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(10)](l1lIII1IIlIll1lIIllI1[2], I11IlI1lII1lI1lll11[2])}
        end
      local function III1IIl1lI1IIlll1III(lIIlIIIlllll1, l111III1lI11lI1IlIIIl)
          return {I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(11)](lIIlIIIlllll1[1], l111III1lI11lI1IlIIIl[1]), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(11)](lIIlIIIlllll1[2], l111III1lI11lI1IlIIIl[2])}
        end
      local function IIIIIIIl1lI1l1lIll11(lIIIlll1Ill1lI1IlIl, I1l11lI11lllIll11lII)
          return {I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(12)](lIIIlll1Ill1lI1IlIl[1], I1l11lI11lllIll11lII[1]), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(12)](lIIIlll1Ill1lI1IlIl[2], I1l11lI11lllIll11lII[2])}
        end
      local function lIIllIlII11IlIIlI11II(l1lI1l11IIl1111I1llll)
          return {I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(13)](l1lI1l11IIl1111I1llll[1]), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(13)](l1lI1l11IIl1111I1llll[2])}
        end
      local function l1IIlllI1IIll111IIII1(lIlI1IIIIlI1l1l1I1lI1, I11l1l1l1lllIIl1lIllI)
          I11l1l1l1lllIIl1lIllI = I11l1l1l1lllIIl1lIllI % 64
          if I11l1l1l1lllIIl1lIllI == 0 then
              return {lIlI1IIIIlI1l1l1I1lI1[1], lIlI1IIIIlI1l1l1I1lI1[2]}
            end
          if I11l1l1l1lllIIl1lIllI >= 32 then
              local l1Il11l1II1IIl1I1lI1I = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(14)](lIlI1IIIIlI1l1l1I1lI1[2], I11l1l1l1lllIIl1lIllI - 32)
              return {l1Il11l1II1IIl1I1lI1I, 0}
            end
          local IIllIIIII11I1Il1IIIllI = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(12)](I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(14)](lIlI1IIIIlI1l1l1I1lI1[1], I11l1l1l1lllIIl1lIllI), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(15)](lIlI1IIIIlI1l1l1I1lI1[2], 32 - I11l1l1l1lllIIl1lIllI))
          local l1IIlIllIll11I1IIll1 = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(14)](lIlI1IIIIlI1l1l1I1lI1[2], I11l1l1l1lllIIl1lIllI)
          return {IIllIIIII11I1Il1IIIllI, l1IIlIllIll11I1IIll1}
        end
      local function I11III1l1lIllI11lllI(IIl1I1llI111llIII1l1I, lIIIllII11Ill11llIII1)
          lIIIllII11Ill11llIII1 = lIIIllII11Ill11llIII1 % 64
          if lIIIllII11Ill11llIII1 == 0 then
              return {IIl1I1llI111llIII1l1I[1], IIl1I1llI111llIII1l1I[2]}
            end
          if lIIIllII11Ill11llIII1 >= 32 then
              local III11llIl1III1ll11l1I = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(15)](IIl1I1llI111llIII1l1I[1], lIIIllII11Ill11llIII1 - 32)
              return {0, III11llIl1III1ll11l1I}
            end
          local IIIIIlIIl1l1II11IIlIl = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(15)](IIl1I1llI111llIII1l1I[1], lIIIllII11Ill11llIII1)
          local IIlllI11l1lI1lII1II1II = I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(12)](I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(15)](IIl1I1llI111llIII1l1I[2], lIIIllII11Ill11llIII1), I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(14)](IIl1I1llI111llIII1l1I[1], 32 - lIIIllII11Ill11llIII1))
          return {IIIIIlIIl1l1II11IIlIl, IIlllI11l1lI1lII1II1II}
        end
      local function II1IlII1I11IlIlI11(IIIIIl1I11IIl1IIIIl1, l1lI1ll1lIIlI1IIII1ll)
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(10)](IIIIIl1I11IIl1IIIIl1, l1lI1ll1lIIlI1IIII1ll)
        end
      local function lIlIllI11lI111llIl1I11(l1ll1lIIlllII1l1ll1Il, l1l1IIlIllIlll1IllllI)
          local l1Il1l1l1lll1ll1Il1 = 73
          l1Il1l1l1lll1ll1Il1 = 73
          if 1 == 0 then
              local lIl1I11lI1l11111111lI
            end
          do
              l1Il1l1l1lll1ll1Il1 = l1Il1l1l1lll1ll1Il1
            end
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(11)](l1ll1lIIlllII1l1ll1Il, l1l1IIlIllIlll1IllllI)
        end
      local function IIll1l11ll1IIIl11Il1lI(lIllllll1IllllI1ll1lI1, l1I11lIIIIlllI11IlIlI)
          local lI111l1Il1ll111I1111 = 456
          lI111l1Il1ll111I1111 = 456
          if 1 == 0 then
              local I11llII1lllIl1I111II1
            end
          do
              lI111l1Il1ll111I1111 = lI111l1Il1ll111I1111
            end
          local I1II11l11ll111IIIII1l = 914
          I1II11l11ll111IIIII1l = 914
          if 1 == 0 then
              local l1l1I1IllI1l11ll1l1I
            end
          do
              I1II11l11ll111IIIII1l = I1II11l11ll111IIIII1l
            end
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(12)](lIllllll1IllllI1ll1lI1, l1I11lIIIIlllI11IlIlI)
        end
      local function I1lIlIlllll11IIl1I1(lIlIIlIl11l1l1l11Il1I)
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(13)](lIlIIlIl11l1l1l11Il1I)
        end
      local function I1ll1IlI1I1II111lll1l(lII1III111IIIlll11I1I, IIlIIIIlll1lII11I11Il)
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(14)](lII1III111IIIlll11I1I, IIlIIIIlll1lII11I11Il)
        end
      local function IIlIIl111Ill1I1l1I1I1I(IIIlllll1lI1I111l11l1, l1111l1IIl11IlIlI1Il)
          return I1IlllIlI11l1Ill11I1l[lI1Il111IlIIll11IIlI(15)](IIIlllll1lI1I111l11l1, l1111l1IIl11IlIlI1Il)
        end
      local I1IIl1I11IIlIlllIII1 = {206, 35, 106}
      local I11IIll111lIIlIllIl1 = lIlllIIIIl1IIl1l1Ill1l(0)
      for lIllIlIII1IIII1I1I1l = 1, #I1IIl1I11IIlIlllIII1 do
          local lIlI1lI1Ill1I1l11l1IlI = I1IIl1I11IIlIlllIII1[lIllIlIII1IIII1I1I1l]
          local l11I1ll1I1lllIl1IIlll = lIlllIIIIl1IIl1l1Ill1l(lIlI1lI1Ill1I1l11l1IlI)
          I11IIll111lIIlIllIl1 = IIlIl1I1l1lll11lll1llI(I11111l1l11l1IlllI1ll(I11IIll111lIIlIllIl1, l11I1ll1I1lllIl1IIlll), III1IIl1lI1IIlll1III(l1IIlllI1IIll111IIII1(l11I1ll1I1lllIl1IIlll, (lIllIlIII1IIII1I1I1l - 1) % 3), lIlllIIIIl1IIl1l1Ill1l(0xff)))
          I11IIll111lIIlIllIl1 = III1IIl1lI1IIlll1III(I11IIll111lIIlIllIl1, lIlllIIIIl1IIl1l1Ill1l(0xff))
        end
      I11IIll111lIIlIllIl1 = lIIl1Ill11I11II1II1Il(I11111l1l11l1IlllI1ll(I11IIll111lIIlIllIl1, lIlllIIIIl1IIl1l1Ill1l(55 + 5)))
      local IIl1l11lIl1lIlI1l1l1 = {26, 18, 4, 2, 3, 50, 39, 20, 30, 97, 98, 89, 84, 67, 109, 115, 124, 100, 103, 128, 158, 180, 158, 160, 138, 152, 166, 163, 204, 238, 219, 222, 243, 235, 250, 249, 237, 2, 40, 25}
      local lIlI1llll11IIIIIllll11 = 185 + 162 + I11IIll111lIIlIllIl1
      lIlI1llll11IIIIIllll11 = (lIlI1llll11IIIIIllll11 % 255) + 1
      local IIlI1lIIl11Illl1II11 = {}
      for l11lllllIII1lIlIIII1 = 1, #IIl1l11lIl1lIlI1l1l1 do
          local IIlI1lllIIIIllllllII = l11lllllIII1lIlIIII1 - 1
          IIlI1lllIIIIllllllII = IIlI1lllIIIIllllllII * 7
          IIlI1lllIIIIllllllII = IIlI1lllIIIIllllllII + lIlI1llll11IIIIIllll11
          IIlI1lllIIIIllllllII = IIlI1lllIIIIllllllII % 255
          IIlI1lIIl11Illl1II11[l11lllllIII1lIlIIII1] = II1IlII1I11IlIlI11(IIl1l11lIl1lIlI1l1l1[l11lllllIII1lIlIIII1], IIlI1lllIIIIllllllII)
        end
      local lIl11III1I1I1I1lllI11 = IIlI1lIIl11Illl1II11[(9 - 8)]
      local l1Il1I1Ill11111IIIII1 = IIlI1lIIl11Illl1II11[(3 - 1)]
      local lIl1llllI1III1I1l11ll1 = IIlI1lIIl11Illl1II11[(9 - 6)]
      local IIl1Il1IIllIllI1I11I1 = IIlI1lIIl11Illl1II11[(11 - 7)]
      local lIlIII1IlllllI1I1Il1l = IIlI1lIIl11Illl1II11[(12 - 7)]
      local lIlII111lI1lII1I1IlI = IIlI1lIIl11Illl1II11[(12 - 6)]
      local IIll1Il1lIlIlII11II11 = IIlI1lIIl11Illl1II11[(14 - 7)]
      local l11lI11IIIlI1111Il1ll = IIlI1lIIl11Illl1II11[(10 - 2)]
      local lI11I1l1lllllll1l1III = IIlI1lIIl11Illl1II11[(14 - 5)]
      local IIll111I11l1Il11IIl111 = IIlI1lIIl11Illl1II11[(17 - 7)]
      local III1111lI1111l11I11l = IIlI1lIIl11Illl1II11[(18 - 7)]
      local I1Ill111ll1lIl1l1I1Il = IIlI1lIIl11Illl1II11[(18 - 6)]
      local l1I1lIl11I1III11I11l1 = IIlI1lIIl11Illl1II11[(22 - 9)]
      local I1Illl1l1llI1Il1ll1l = IIlI1lIIl11Illl1II11[(22 - 8)]
      local l1IIll1IlII1lllI1l11I = IIlI1lIIl11Illl1II11[(18 - 3)]
      local l1ll1I11l11Il1l1IlIll = IIlI1lIIl11Illl1II11[(25 - 9)]
      local I1lIIIl1llI11IlIll11l = IIlI1lIIl11Illl1II11[(23 - 6)]
      local lIlI111I1ll1I111II1Il1 = IIlI1lIIl11Illl1II11[(26 - 8)]
      local lIlI11lllIllI11I11 = IIlI1lIIl11Illl1II11[(20 - 1)]
      local lI1IlIIIl1l111Illl1Il = IIlI1lIIl11Illl1II11[(26 - 6)]
      local IIlllI1I1llll1lI1l11lI = IIlI1lIIl11Illl1II11[(25 - 4)]
      local lIIl11I11lIlllIIIII11 = IIlI1lIIl11Illl1II11[(26 - 4)]
      local IIllIIlIll1IllII11I1 = IIlI1lIIl11Illl1II11[(28 - 5)]
      local l1llI1IIlIllllI1111l1 = IIlI1lIIl11Illl1II11[(30 - 6)]
      local l1I1lII1lIlIl1I1Il1 = IIlI1lIIl11Illl1II11[(29 - 4)]
      local l1Il1lIIIIl11IIlIl1l1 = IIlI1lIIl11Illl1II11[(29 - 3)]
      local II1lI1I11lI11ll1I11 = IIlI1lIIl11Illl1II11[(30 - 3)]
      local l1I1Il11lI11lllII1lll = IIlI1lIIl11Illl1II11[(35 - 7)]
      local II1llII1lIl11lI1l1ll1 = IIlI1lIIl11Illl1II11[(38 - 9)]
      local l1IIIllI111lllIII11l1 = IIlI1lIIl11Illl1II11[(32 - 2)]
      local l1IlII111II1lI111llII = IIlI1lIIl11Illl1II11[(32 - 1)]
      local l1II111IIIIl1111I1II1 = IIlI1lIIl11Illl1II11[(38 - 6)]
      local lIlI1l11IlI1I11l111lII = IIlI1lIIl11Illl1II11[(39 - 6)]
      local l1l1Il1lIIl1IIl1Illl = IIlI1lIIl11Illl1II11[(37 - 3)]
      local lII11IIl1lI1Il1I11II = IIlI1lIIl11Illl1II11[(39 - 4)]
      local lI11ll11IlI11ll1lIlI = IIlI1lIIl11Illl1II11[(40 - 4)]
      local lIlllIl1IIl11I1111111I = IIlI1lIIl11Illl1II11[(43 - 6)]
      local III11II1llI1lI1l1Illl = IIlI1lIIl11Illl1II11[(39 - 1)]
      local lIlIIIl1IIl1IIllI11111 = IIlI1lIIl11Illl1II11[(45 - 6)]
      local lIl1I1I1l1II1llIlll1I = IIlI1lIIl11Illl1II11[(41 - 1)]
      local IIllIII1Il1IlI1l11ll11 = {149, 139}
      local l1l1lII1II1111ll = II1IlII1I11IlIlI11(76, 32) + I11IIll111lIIlIllIl1
      l1l1lII1II1111ll = (l1l1lII1II1111ll % 255) + 1
      local l11lI1lIl1llI1I1l1Il1 = {}
      for IIll11IlIlI11I1llI11Il = 1, #IIllIII1Il1IlI1l11ll11 do
          local I11l11IlIIlI11IllI = IIll11IlIlI11I1llI11Il - 1
          I11l11IlIIlI11IllI = I11l11IlIIlI11IllI * 13
          I11l11IlIIlI11IllI = I11l11IlIIlI11IllI + l1l1lII1II1111ll
          I11l11IlIIlI11IllI = I11l11IlIIlI11IllI % 255
          l11lI1lIl1llI1I1l1Il1[IIll11IlIlI11I1llI11Il] = II1IlII1I11IlIlI11(IIllIII1Il1IlI1l11ll11[IIll11IlIlI11I1llI11Il], I11l11IlIIlI11IllI)
        end
      local l11I1lllI11IllI1III1l = #l11lI1lIl1llI1I1l1Il1
      local lII1l111llIl1lIl11ll = {{4, lI1Il111IlIIll11IIlI(16)}, {4, lI1Il111IlIIll11IIlI(17)}, {4, lI1Il111IlIIll11IIlI(18)}, {0, lI1Il111IlIIll11IIlI(19)}, {3, lI1Il111IlIIll11IIlI(20)}}
      local lI111Il1l1l11lIllIlIl = {144, 198, 208, 135, 220, 113, 195, 67, 179, 238, 25, 35, 23}
      local IIIII11Ill1111IlIII1 = {}
      local l1Il1IIIIl1Ill11111I1 = {}
      local l1IIIIllIlll11l111l1 = {}
      local l11lllIlIl1IllllI1111 = II1IlII1I11IlIlI11(25, 78) + I11IIll111lIIlIllIl1
      l11lllIlIl1IllllI1111 = (l11lllIlIl1IllllI1111 % 255) + 1
      for lIll111I11111l1llI1Ill = 1, #lI111Il1l1l11lIllIlIl do
          local I11II1I11l1I1II11ll = lIll111I11111l1llI1Ill - 1
          I11II1I11l1I1II11ll = I11II1I11l1I1II11ll * 11
          I11II1I11l1I1II11ll = I11II1I11l1I1II11ll + l11lllIlIl1IllllI1111
          I11II1I11l1I1II11ll = I11II1I11l1I1II11ll % 255
          IIIII11Ill1111IlIII1[lIll111I11111l1llI1Ill] = II1IlII1I11IlIlI11(lI111Il1l1l11lIllIlIl[lIll111I11111l1llI1Ill], I11II1I11l1I1II11ll)
        end
      local I11l1lI11lI1lll1lI1 = #IIIII11Ill1111IlIII1
      local l1I111lllllIl1l1Il11 = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(21)]
      local function II11IlI11l1llIl11l1(lIIII1l1Illl11l1llI)
          if l1IIIIllIlll11l111l1[lIIII1l1Illl11l1llI] then
              return l1Il1IIIIl1Ill11111I1[lIIII1l1Illl11l1llI]
            end
          l1IIIIllIlll11l111l1[lIIII1l1Illl11l1llI] = true
          local lI1I1II1Il11l1III111I = lII1l111llIl1lIl11ll[lIIII1l1Illl11l1llI]
          if not lI1I1II1Il11l1III111I then
              return nil
            end
          local IIIll1lIIIIIl1II1ll1I = lI1I1II1Il11l1III111I[1]
          local II1ll1I1Il1I1lIlIIlI1 = lI1I1II1Il11l1III111I[2]
          local lI1111lIlIlll1Ill1I1l = {}
          for l1Il1IlIlII1l1II1IllI = 1, #II1ll1I1Il1I1lIlIIlI1 do
              local l1111lllIII111lI1I1II = (l1Il1IlIlII1l1II1IllI - 1) % I11l1lI11lI1lll1lI1 + 1
              local I1lI1II111l1I1II11I1 = l1I111lllllIl1l1Il11(II1ll1I1Il1I1lIlIIlI1, l1Il1IlIlII1l1II1IllI) - IIIII11Ill1111IlIII1[l1111lllIII111lI1I1II]
              if I1lI1II111l1I1II11I1 < 0 then
                  I1lI1II111l1I1II11I1 = I1lI1II111l1I1II11I1 + 256
                end
              lI1111lIlIlll1Ill1I1l[l1Il1IlIlII1l1II1IllI] = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](I1lI1II111l1I1II11I1)
            end
          local IIll1II1lI11lIIll111l = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(2)][lI1Il111IlIIll11IIlI(7)](lI1111lIlIlll1Ill1I1l)
          local IIllI1lIll1l1I1lI11l
          if IIIll1lIIIIIl1II1ll1I == 0 then
              IIllI1lIll1l1I1lI11l = nil
      elseif IIIll1lIIIIIl1II1ll1I == 1 then
              IIllI1lIll1l1I1lI11l = false
      elseif IIIll1lIIIIIl1II1ll1I == 2 then
              IIllI1lIll1l1I1lI11l = true
      elseif IIIll1lIIIIIl1II1ll1I == 3 then
              IIllI1lIll1l1I1lI11l = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(22)](IIll1II1lI11lIIll111l)
            else
              IIllI1lIll1l1I1lI11l = IIll1II1lI11lIIll111l
            end
          l1Il1IIIIl1Ill11111I1[lIIII1l1Illl11l1llI] = IIllI1lIll1l1I1lI11l
          return IIllI1lIll1l1I1lI11l
        end
      local lIII1II111l1I11I1IlI1 = {lI1I1lIII1III11l1l1ll, lI1ll11llll1l1IlIl}
      local lIIIIl1ll111l1Il1l1I = {}
      local l1l1II111ll1llII111II = 0
      local lIlll11lIIllIIIlIlllIl
      local lIIlIlI1111111lllIIll = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(5)]
      if l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(6)](lIIlIlI1111111lllIIll) == lI1Il111IlIIll11IIlI(1) then
          lIlll11lIIllIIIlIlllIl = lIIlIlI1111111lllIIll(1)
        end
      if l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(6)](lIlll11lIIllIIIlIlllIl) ~= lI1Il111IlIIll11IIlI(2) then
          lIlll11lIIllIIIlIlllIl = _G
        end
      local lII1l1llllI11Il1llII = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(2)][lI1Il111IlIIll11IIlI(23)]
      if lII1l1llllI11Il1llII == nil then
          lII1l1llllI11Il1llII = function(...)
  return {[lI1Il111IlIIll11IIlI(26)] = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(25)](lI1Il111IlIIll11IIlI(24), ...), ...}
end
        end
      local I1llII1ll1I1llIl1IIl = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(2)][lI1Il111IlIIll11IIlI(27)]
      if I1llII1ll1I1llIl1IIl == nil then
          local function lIlll1lll11Ill1lI1111I(lIlllIl11I11I11l1111ll, I11IIIll11lIl111l1II, l1l111IlIIl1IIlIlII1I)
              I11IIIll11lIl111l1II = I11IIIll11lIl111l1II or 1
              l1l111IlIIl1IIlIlII1I = l1l111IlIIl1IIlIlII1I or (lIlllIl11I11I11l1111ll[lI1Il111IlIIll11IIlI(26)] or #lIlllIl11I11I11l1111ll)
              if I11IIIll11lIl111l1II > l1l111IlIIl1IIlIlII1I then
                  return
                end
              return lIlllIl11I11I11l1111ll[I11IIIll11lIl111l1II], lIlll1lll11Ill1lI1111I(lIlllIl11I11I11l1111ll, I11IIIll11lIl111l1II + 1, l1l111IlIIl1IIlIlII1I)
            end
          I1llII1ll1I1llIl1IIl = lIlll1lll11Ill1lI1111I
        end
      local lI1llIllIIIIllll1III = {l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](80, 223, 240, 1, 134, 35, 52, 69, 195, 103, 120, 137, 21, 171, 188, 205, 88, 239, 0, 17, 166, 51, 68, 85, 239, 119, 136, 153, 63, 187, 204, 221, 123, 255, 16, 33, 162, 67, 84, 101, 241, 135, 152, 169, 62, 203, 220, 237, 103, 15, 32, 49, 215, 83, 100, 117, 19, 151, 168, 185) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](104, 219, 236, 253, 138, 31, 48, 65, 214, 99, 116, 133, 25, 167, 184, 201, 78, 235, 252, 13, 139, 47, 64, 81, 237, 115, 132, 149, 33, 183, 200, 217, 110, 251, 12, 29, 172, 63, 80, 97, 231, 131, 148, 165, 35, 199, 216, 233, 88, 11, 28, 45, 186, 79, 96, 113, 6, 147, 164, 181) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](73, 215, 232, 249, 157, 27, 44, 61, 219, 95, 112, 129, 29, 163, 180, 197, 83, 231, 248, 9, 158, 43, 60, 77, 192, 111, 128, 145, 53, 179, 196, 213, 115, 247, 8, 25, 168, 59, 76, 93, 234, 127, 144, 161, 54, 195, 212, 229, 116, 7, 24, 41, 175, 75, 92, 109, 235, 143, 160, 177) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](82, 211, 228, 245, 134, 23, 40, 57, 206, 91, 108, 125, 5, 159, 176, 193, 68, 227, 244, 5, 131, 39, 56, 73, 213, 107, 124, 141, 30, 175, 192, 209, 102, 243, 4, 21, 178, 55, 72, 89, 254, 123, 140, 157, 56, 191, 208, 225, 98, 3, 20, 37, 181, 71, 88, 105, 254, 139, 156, 173) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](63, 207, 224, 241, 145, 19, 36, 53, 211, 87, 104, 121, 26, 155, 172, 189, 79, 223, 240, 1, 150, 35, 52, 69, 200, 103, 120, 137, 10, 171, 188, 205, 75, 239, 0, 17, 173, 51, 68, 85, 228, 119, 136, 153, 46, 187, 204, 221, 112, 255, 16, 33, 160, 67, 84, 101, 227, 135, 152, 169) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](63, 203, 220, 237, 120, 15, 32, 49, 196, 83, 100, 117, 7, 151, 168, 185, 86, 219, 236, 253, 155, 31, 48, 65, 194, 99, 116, 133, 26, 167, 184, 201, 94, 235, 252, 13, 128, 47, 64, 81, 255, 115, 132, 149, 51, 183, 200, 217, 116, 251, 12, 29, 174, 63, 80, 97, 246, 131, 148, 165) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](11, 199, 216, 233, 111, 11, 28, 45, 171, 79, 96, 113, 11, 147, 164, 181, 107, 215, 232, 249, 142, 27, 44, 61, 250, 95, 112, 129, 7, 163, 180, 197, 67, 231, 248, 9, 149, 43, 60, 77, 210, 111, 128, 145, 38, 179, 196, 213, 103, 247, 8, 25, 184, 59, 76, 93, 251, 127, 144, 161), l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](61, 195, 212, 229, 113, 7, 24, 41, 190, 75, 92, 109, 224, 143, 160, 177, 94, 211, 228, 245, 147, 23, 40, 57, 210, 91, 108, 125, 10, 159, 176, 193, 86, 227, 244, 5, 151, 39, 56, 73, 204, 107, 124, 141, 11, 175, 192, 209, 104, 243, 4, 21, 181, 55, 72, 89, 238, 123, 140, 157) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](26, 191, 208, 225, 103, 3, 20, 37, 163, 71, 88, 105, 245, 139, 156, 173, 57, 207, 224, 241, 134, 19, 36, 53, 201, 87, 104, 121, 26, 155, 172, 189, 91, 223, 240, 1, 180, 35, 52, 69, 210, 103, 120, 137, 30, 171, 188, 205, 82, 239, 0, 17, 131, 51, 68, 85, 243, 119, 136, 153) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](15, 187, 204, 221, 106, 255, 16, 33, 182, 67, 84, 101, 232, 135, 152, 169, 43, 203, 220, 237, 107, 15, 32, 49, 220, 83, 100, 117, 0, 151, 168, 185, 78, 219, 236, 253, 190, 31, 48, 65, 199, 99, 116, 133, 3, 167, 184, 201, 65, 235, 252, 13, 155, 47, 64, 81, 230, 115, 132, 149) .. l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(3)](61, 183, 200, 217, 74, 251, 12, 29, 187, 63, 80, 97, 215, 131, 148, 165, 50, 199, 216, 233, 126, 11, 28, 45, 160, 79, 96, 113, 20, 147, 164, 181, 83, 215, 232, 249, 145, 27, 44, 61, 203, 95, 112, 129, 22, 163, 180, 197, 92, 231, 248, 9, 143, 43, 60, 77, 203, 111, 128, 145)}
      local I11IlllII11IIlI11IlI1 = {1, 2}
      local lIlIIIl1l11IIl11l1l11l = {}
      for I1I11ll1I11I1II1lII1l = 1, #I11IlllII11IIlI11IlI1 do
          lIlIIIl1l11IIl11l1l11l[I1I11ll1I11I1II1lII1l] = lI1llIllIIIIllll1III[I11IlllII11IIlI11IlI1[I1I11ll1I11I1II1lII1l]]
        end
      local lI111lIIlI1lIlllIl1Il = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(2)][lI1Il111IlIIll11IIlI(7)](lIlIIIl1l11IIl11l1l11l)
      local I11Il1l1I1III1llIllII = 11 + 31 + I11IIll111lIIlIllIl1
      I11Il1l1I1III1llIllII = (I11Il1l1I1III1llIllII % 255) + 1
      local II1Il111l1lI1lIIl111 = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(4)][lI1Il111IlIIll11IIlI(21)]
      local function II1l111III1lllI1lllll(lII1111IlIIIIIl1lIlll)
          local lIllI1lI11lI1IlllI111 = 978
          lIllI1lI11lI1IlllI111 = 978
          if 1 == 0 then
              local lII11111I1l11l1l11Ill
            end
          do
              lIllI1lI11lI1IlllI111 = lIllI1lI11lI1IlllI111
            end
          local lIllIll1llIl11IIII1I = 103
          lIllIll1llIl11IIII1I = 103
          if 1 == 0 then
              local I1I1lIIIlll11Illll11
            end
          do
              lIllIll1llIl11IIII1I = lIllIll1llIl11IIII1I
            end
          local lIlll1I11IIlll111l11Il = II1Il111l1lI1lIIl111(lI111lIIlI1lIlllIl1Il, lII1111IlIIIIIl1lIlll)
          local l11l1IllIlIIlIII11I11 = lII1111IlIIIIIl1lIlll - 1
          l11l1IllIlIIlIII11I11 = l11l1IllIlIIlIII11I11 * 17
          l11l1IllIlIIlIII11I11 = l11l1IllIlIIlIII11I11 + I11Il1l1I1III1llIllII
          l11l1IllIlIIlIII11I11 = l11l1IllIlIIlIII11I11 % 256
          return II1IlII1I11IlIlI11(lIlll1I11IIlll111l11Il, l11l1IllIlIIlIII11I11)
        end
      local function lIl111l1lIIIlIIIllIl1(IIllI111lI111l11lI11ll)
          local I11IlIl1llIlI11l1lIIl = 483
          I11IlIl1llIlI11l1lIIl = 483
          if 1 == 0 then
              local I1I1II11lIl111I111Il
            end
          do
              I11IlIl1llIlI11l1lIIl = I11IlIl1llIlI11l1lIIl
            end
          local II1Il11l1llII1Ill1lI1 = 291
          II1Il11l1llII1Ill1lI1 = 291
          if 1 == 0 then
              local II1lII11llI1Il1l1Il1l
            end
          do
              II1Il11l1llII1Ill1lI1 = II1Il11l1llII1Ill1lI1
            end
          local lIlllll1II11lllllll11I = II1l111III1lllI1lllll(IIllI111lI111l11lI11ll)
          local lI1l1IIIl1lIll11IIII = II1l111III1lllI1lllll(IIllI111lI111l11lI11ll + 1)
          local l1IIl11l1llIlIlll1IIl = II1l111III1lllI1lllll(IIllI111lI111l11lI11ll + 2)
          local I11I1llI1llIl1Ill1Ill = II1l111III1lllI1lllll(IIllI111lI111l11lI11ll + 3)
          return lIlllll1II11lllllll11I + lI1l1IIIl1lIll11IIII * 256 + l1IIl11l1llIlIlll1IIl * 65536 + I11I1llI1llIl1Ill1Ill * 16777216
        end
      local function I1llI11IIllll1lIlI1lI(IIll1IIIIIIIl11ll1ll11)
          local lIl1IlIIIIl111ll1IIl = 584
          lIl1IlIIIIl111ll1IIl = 584
          if 1 == 0 then
              local II1IllIIl1I1lI1l1Il1l
            end
          do
              lIl1IlIIIIl111ll1IIl = lIl1IlIIIIl111ll1IIl
            end
          local IIII1llI1l11II1I11Il = IIll1IIIIIIIl11ll1ll11 - 1
          IIII1llI1l11II1I11Il = IIII1llI1l11II1I11Il * 12 + 1
          local lIl1I1I1lIlllI1IIl11 = lIl111l1lIIIlIIIllIl1(IIII1llI1l11II1I11Il)
          local IIlIl1lI11lllIlllIIlll = lIl111l1lIIIlIIIllIl1(IIII1llI1l11II1I11Il + 4)
          local IIll111I11lllIIIlIllII = lIl111l1lIIIlIIIllIl1(IIII1llI1l11II1I11Il + 8)
          return lIl1I1I1lIlllI1IIl11, IIlIl1lI11lllIlllIIlll, IIll111I11lllIIIlIllII
        end
      local lIIl1II1111I11lIII1l1 = 1
      while true do
          local lI11III11lIIIIl1ll1I, IIlI1I1lIlIIIl1l1Illl1, l1lIIIll111Illl1lll11 = I1llI11IIllll1lIlI1lI(lIIl1II1111I11lIII1l1)
          local l1l11lIIIII111lIIll1l = 0
          if l11I1lllI11IllI1III1l > 0 then
              local lII1Il11lIl111Illll11 = lIIl1II1111I11lIII1l1 + I11IIll111lIIlIllIl1 - 1
              lII1Il11lIl111Illll11 = lII1Il11lIl111Illll11 % l11I1lllI11IllI1III1l
              lII1Il11lIl111Illll11 = lII1Il11lIl111Illll11 + 1
              l1l11lIIIII111lIIll1l = l11lI1lIl1llI1I1l1Il1[lII1Il11lIl111Illll11]
              lI11III11lIIIIl1ll1I = II1IlII1I11IlIlI11(lI11III11lIIIIl1ll1I, l1l11lIIIII111lIIll1l)
              IIlI1I1lIlIIIl1l1Illl1 = II1IlII1I11IlIlI11(IIlI1I1lIlIIIl1l1Illl1, l1l11lIIIII111lIIll1l)
              l1lIIIll111Illl1lll11 = II1IlII1I11IlIlI11(l1lIIIll111Illl1lll11, l1l11lIIIII111lIIll1l)
            end
          if lI11III11lIIIIl1ll1I == lIl11III1I1I1I1lllI11 then
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1Il1I1Ill11111IIIII1 then
              l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = II11IlI11l1llIl11l1(IIlI1I1lIlIIIl1l1Illl1)
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIl1llllI1III1I1l11ll1 then
              l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = lIII1II111l1I11I1IlI1[IIlI1I1lIlIIIl1l1Illl1]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == IIl1Il1IIllIllI1I11I1 then
              lIII1II111l1I11I1IlI1[IIlI1I1lIlIIIl1l1Illl1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlIII1IlllllI1I1Il1l then
              l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = lIlll11lIIllIIIlIlllIl[II11IlI11l1llIl11l1(IIlI1I1lIlIIIl1l1Illl1)]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlII111lI1lII1I1IlI then
              lIlll11lIIllIIIlIlllIl[II11IlI11l1llIl11l1(IIlI1I1lIlIIIl1l1Illl1)] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == IIll1Il1lIlIlII11II11 then
              l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = {}
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l11lI11IIIlI1111Il1ll then
              l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lI11I1l1lllllll1l1III then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == IIll111I11l1Il11IIl111 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == III1111lI1111l11I11l then
              local I1II1lllIII11llII11I = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              local l111lIlI1Il11IlI11I1l = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = l111lIlI1Il11IlI11I1l[I1II1lllIII11llII11I]
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == I1Ill111ll1lIl1l1I1Il then
              local lIll1llIIlII1I1I11lllI = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              local l1l1ll11IlI111Il1Il = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = nil
              local I11II1IIIlll1I11I111 = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 2]
              I11II1IIIlll1I11I111[l1l1ll11IlI111Il1Il] = lIll1llIIlII1I1I11lllI
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 2] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 3
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1I1lIl11I1III11I11l1 then
              local I111Illl1I1111Il1l1lI = IIlI1I1lIlIIIl1l1Illl1
              local IIllI1lI1l1Illlll111lI = l1lIIIll111Illl1lll11
              local I1IlIllllIll1lII111 = l1l1II111ll1llII111II - I111Illl1I1111Il1l1lI
              local I1II11Il1lIlIII1II1II = lIIIIl1ll111l1Il1l1I[I1IlIllllIll1lII111]
              if IIllI1lI1l1Illlll111lI == 0 then
                  I1II11Il1lIlIII1II1II(I1llII1ll1I1llIl1IIl(lIIIIl1ll111l1Il1l1I, I1IlIllllIll1lII111 + 1, l1l1II111ll1llII111II))
                  for l1111lll1lII1lIIlII1 = l1l1II111ll1llII111II, I1IlIllllIll1lII111, -1 do
                      lIIIIl1ll111l1Il1l1I[l1111lll1lII1lIIlII1] = nil
                    end
                  l1l1II111ll1llII111II = I1IlIllllIll1lII111 - 1
                else
                  local lIllIl1lIlIIlll1ll1lII = lII1l1llllI11Il1llII(I1II11Il1lIlIII1II1II(I1llII1ll1I1llIl1IIl(lIIIIl1ll111l1Il1l1I, I1IlIllllIll1lII111 + 1, l1l1II111ll1llII111II)))
                  for lIlllII11II1I1l1lll1l = l1l1II111ll1llII111II, I1IlIllllIll1lII111, -1 do
                      lIIIIl1ll111l1Il1l1I[lIlllII11II1I1l1lll1l] = nil
                    end
                  l1l1II111ll1llII111II = I1IlIllllIll1lII111 - 1
                  if IIllI1lI1l1Illlll111lI == 1 then
                      l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
                      lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = lIllIl1lIlIIlll1ll1lII[1]
                    else
                      for lIll1lI11I11l1II11ll11 = 1, IIllI1lI1l1Illlll111lI do
                          l1l1II111ll1llII111II = l1l1II111ll1llII111II + 1
                          lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = lIllIl1lIlIIlll1ll1lII[lIll1lI11I11l1II11ll11]
                        end
                    end
                end
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == I1Illl1l1llI1Il1ll1l then
              local II1lIIIllIIIIIIllllI1 = IIlI1I1lIlIIIl1l1Illl1
              if II1lIIIllIIIIIIllllI1 == 0 then
                  return
        elseif II1lIIIllIIIIIIllllI1 == 1 then
                  return lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
                else
                  local I1lllII1lII11llllll1l = l1l1II111ll1llII111II - II1lIIIllIIIIIIllllI1 + 1
                  return I1llII1ll1I1llIl1IIl(lIIIIl1ll111l1Il1l1I, I1lllII1lII11llllll1l, l1l1II111ll1llII111II)
                end
      elseif lI11III11lIIIIl1ll1I == l1IIll1IlII1lllI1l11I then
              lIIl1II1111I11lIII1l1 = IIlI1I1lIlIIIl1l1Illl1
      elseif lI11III11lIIIIl1ll1I == l1ll1I11l11Il1l1IlIll then
              if not lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] then
                  lIIl1II1111I11lIII1l1 = IIlI1I1lIlIIIl1l1Illl1
                else
                  lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
                end
      elseif lI11III11lIIIIl1ll1I == I1lIIIl1llI11IlIll11l then
              if lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] then
                  lIIl1II1111I11lIII1l1 = IIlI1I1lIlIIIl1l1Illl1
                else
                  lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
                end
      elseif lI11III11lIIIIl1ll1I == lIlI111I1ll1I111II1Il1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] + lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlI11lllIllI11I11 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] - lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lI1IlIIIl1l111Illl1Il then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] * lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == IIlllI1I1llll1lI1l11lI then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] / lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIIl11I11lIlllIIIII11 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(9)][lI1Il111IlIIll11IIlI(8)](lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] / lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == IIllIIlIll1IllII11I1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] % lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1llI1IIlIllllI1111l1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] ^ lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1I1lII1lIlIl1I1Il1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] .. lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1Il1lIIIIl11IIlIl1l1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] == lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == II1lI1I11lI11ll1I11 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] ~= lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1I1Il11lI11lllII1lll then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] < lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == II1llII1lIl11lI1l1ll1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] <= lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1IIIllI111lllIII11l1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] > lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1IlII111II1lI111llII then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] >= lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1II111IIIIl1111I1II1 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = lIlIllI11lI111llIl1I11(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlI1l11IlI1I11l111lII then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = IIll1l11ll1IIIl11Il1lI(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == l1l1Il1lIIl1IIl1Illl then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = II1IlII1I11IlIlI11(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lII11IIl1lI1Il1I11II then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = I1ll1IlI1I1II111lll1l(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lI11ll11IlI11ll1lIlI then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1] = IIlIIl111Ill1I1l1I1I1I(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II - 1], lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = nil
              l1l1II111ll1llII111II = l1l1II111ll1llII111II - 1
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlllIl1IIl11I1111111I then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = -lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == III11II1llI1lI1l1Illl then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = not lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIlIIIl1IIl1IIllI11111 then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = #lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II]
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
      elseif lI11III11lIIIIl1ll1I == lIl1I1I1l1II1llIlll1I then
              lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II] = I1lIlIlllll11IIl1I1(lIIIIl1ll111l1Il1l1I[l1l1II111ll1llII111II])
              lIIl1II1111I11lIII1l1 = lIIl1II1111I11lIII1l1 + 1
            else
              return
            end
        end
    end
end
l1Il1IlIlIIl1l1111Ill[lI1Il111IlIIll11IIlI(28)](lIlIlllll1lI1Il1IIllI1(2, 6))