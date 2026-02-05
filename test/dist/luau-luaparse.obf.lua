do
	local function l11l1IIIll1l1lIIlI11I (lIl11lI1IIlII1lIIIIIl)
		error(lIl11lI1IIlII1lIIIIIl, 0)
	end
	local lIl1Ill1llll1Il1II1Il = type;
	if lIl1Ill1llll1Il1II1Il == nil then
		l11l1IIIll1l1lIIlI11I("Integrity check failed")
	end
	local function lIlIIIlIIII1IlIl11I1 ()
		local l1II1II11Il1lIl1I1I1;
		local l1111lIlll1I11lIll11 = getfenv;
		if lIl1Ill1llll1Il1II1Il(l1111lIlll1I11lIll11) == "function" then
			l1II1II11Il1lIl1I1I1 = l1111lIlll1I11lIll11(1);
		end
		if lIl1Ill1llll1Il1II1Il(l1II1II11Il1lIl1I1I1) ~= "table" then
			l1II1II11Il1lIl1I1I1 = _G;
		end
		local l111ll1lllIllllII1ll1 = getmetatable;
		if lIl1Ill1llll1Il1II1Il(l111ll1lllIllllII1ll1) == "function" then
			local lI1I1llI11lIllIIIlIIl = l111ll1lllIllllII1ll1(l1II1II11Il1lIl1I1I1);
			if lI1I1llI11lIllIIIlIIl ~= nil then
				local III1I11IlIIlIl1l1lIl = _G;
				if lIl1Ill1llll1Il1II1Il(III1I11IlIIlIl1l1lIl) == "table" then
					l1II1II11Il1lIl1I1I1 = III1I11IlIIlIl1l1lIl;
				end
			end
		end
		return l1II1II11Il1lIl1I1I1;
	end
	local function l1l11lIl1I1l1llIIII ()
		local lIlllIIl1ll11llllI1Ill = lIlIIIlIIII1IlIl11I1();
		if lIl1Ill1llll1Il1II1Il(lIlllIIl1ll11llllI1Ill) ~= "table" then
			l11l1IIIll1l1lIIlI11I("Integrity check failed")
		end
		local lII1ll1IlIllI1IIIIIlI = debug;
		if lIl1Ill1llll1Il1II1Il(lII1ll1IlIllI1IIIIIlI) == "table" then
			local l1lI1Il1ll1IlIIl1I1 = lII1ll1IlIllI1IIIIIlI.IIlllIIl1I1Il1lIIll1I;
			if lIl1Ill1llll1Il1II1Il(l1lI1Il1ll1IlIIl1I1) == "function" then
				local I1III1lI1Il11IlIIl1Il, lIlIl11Il11IIIIIlII1II = pcall(l1lI1Il1ll1IlIIl1I1);
				if I1III1lI1Il11IlIIl1Il and lIlIl11Il11IIIIIlII1II ~= nil then
					l11l1IIIll1l1lIIlI11I("Integrity check failed")
				end
			end
		end
		local l1lI1IlIlI1IIII1IlI1I = getmetatable;
		if lIl1Ill1llll1Il1II1Il(l1lI1IlIlI1IIII1IlI1I) == "function" then
			local IIIl1I1IIl11lIl1I11II = l1lI1IlIlI1IIII1IlI1I(lIlllIIl1ll11llllI1Ill);
			if IIIl1I1IIl11lIl1I11II ~= nil then
				l11l1IIIll1l1lIIlI11I("Integrity check failed")
			end
		end
	end
	l1l11lIl1I1l1llIIII()
	local lIll111Ill11IIlI11IIIl = false;
	if lIll111Ill11IIlI11IIIl then
		local l1IIlI1l1l1lIlllIll1l = setmetatable;
		if lIl1Ill1llll1Il1II1Il(l1IIlI1l1l1lIlllIll1l) == "function" then
			local l1llIlllll1lll111Illl = lIlIIIlIIII1IlIl11I1();
			local IIIlI1IlII1llI11I1II = getmetatable(l1llIlllll1lll111Illl);
			if IIIlI1IlII1llI11I1II == nil then
				IIIlI1IlII1llI11I1II = {  };
				l1IIlI1l1l1lIlllIll1l(l1llIlllll1lll111Illl, IIIlI1IlII1llI11I1II)
			end
			if IIIlI1IlII1llI11I1II.l1Il1llllIlI1l11Illl1 == nil then
				IIIlI1IlII1llI11I1II.l1Il1llllIlI1l11Illl1 = "locked";
			end
			if IIIlI1IlII1llI11I1II.I11lllI1lI111ll1l1l11 == nil then
				IIIlI1IlII1llI11I1II.I11lllI1lI111ll1l1l11 = function ()
					error("Runtime integrity violation", 0)
				end;
			end
		end
	end
end
local IIll1llIl11II1I11I11I = { { 9, 81, 26, 244, 254, 149, 118, 170 }, { 23, 61, 14, 253, 239 }, { 6, 68, 13, 3 }, { 22, 80, 30, 250, 248, 147 }, { 10, 65, 32, 247, 239, 154, 125 }, { 23, 85, 28, 246 }, { 6, 75, 26, 244, 235, 160 }, { 9, 72, 27, 0, 252 }, { 16, 61, 32, 249 }, { 5, 84, 27, 3 }, { 5, 61, 26, 245 }, { 5, 75, 30 }, { 5, 74, 27, 5 }, { 15, 79, 20, 250, 240, 160 }, { 21, 79, 20, 250, 240, 160 }, { 255, 12 }, { 212, 16, 8, 195, 186, 93, 99, 110, 44, 150 }, { 255, 12, 221 }, { 211 }, { 255, 13, 228, 200, 230, 94, 55, 114 }, { 213, 16, 8, 194, 194, 99, 99, 109, 53 }, { 218, 56, 220, 198, 187, 136, 57, 112, 51 }, {  }, { 255, 14, 221, 200, 230, 93, 58, 116 }, { 5, 85, 32, 246 }, { 23, 75, 26, 6, 247, 142, 108, 174 }, { 19, 61, 15, 252 }, { 198 }, { 22, 65, 24, 246, 237, 160 }, { 17 }, { 24, 74, 28, 242, 237, 151 }, { 19, 78, 21, 255, 254 } };
local IIl1Il1IIIll111IllIl1 = { 163, 220, 172, 145, 138, 44, 7, 60, 252, 99, 55, 201, 146, 112 };
local I11IlII11IIl11lIII1l = {  };
local function I111lI1Il1IlI1I1l1II (I11lII11lI11Ill1Il1ll)
	local l1I11Il1IIIl1Il11IllI = I11IlII11IIl11lIII1l[I11lII11lI11Ill1Il1ll];
	if l1I11Il1IIIl1Il11IllI ~= nil then
		return l1I11Il1IIIl1Il11IllI;
	end
	local IIll1l1l1l11II1III1111 = IIll1llIl11II1I11I11I[I11lII11lI11Ill1Il1ll];
	local l1lIllII11Il1IlI1lI1l = {  };
	local lIl11I1IllIIlI1111Ill = # IIl1Il1IIIll111IllIl1;
	for IIll1III111Il1Ill1I1l1 = 1, # IIll1l1l1l11II1III1111 do
		local IIII1I1lllll111lll1II = IIll1III111Il1Ill1I1l1 - 1;
		IIII1I1lllll111lll1II = IIII1I1lllll111lll1II % lIl11I1IllIIlI1111Ill;
		IIII1I1lllll111lll1II = IIII1I1lllll111lll1II + 1;
		local lII1IlIIlIlI1l1l1l11l = IIll1l1l1l11II1III1111[IIll1III111Il1Ill1I1l1] - IIl1Il1IIIll111IllIl1[IIII1I1lllll111lll1II];
		if lII1IlIIlIlI1l1l1l11l < 0 then
			lII1IlIIlIlI1l1l1l11l = lII1IlIIlIlI1l1l1l11l + 256;
		end
		l1lIllII11Il1IlI1lI1l[IIll1III111Il1Ill1I1l1] = string.char(lII1IlIIlIlI1l1l1l11l);
	end
	local l1llI1Il1lIll1III1 = table.concat(l1lIllII11Il1IlI1lI1l);
	I11IlII11IIl11lIII1l[I11lII11lI11Ill1Il1ll] = l1llI1Il1lIll1III1;
	return l1llI1Il1lIll1III1;
end
local l1I1lIl1IIlIIIlIl11I = nil;
local IIl1IlII1111I1Ill1lI1 = getfenv;
if type(IIl1IlII1111I1Ill1lI1) == I111lI1Il1IlI1I1l1II(1) then
	l1I1lIl1IIlIIIlIl11I = IIl1IlII1111I1Ill1lI1(1);
end
if type(l1I1lIl1IIlIIIlIl11I) ~= I111lI1Il1IlI1I1l1II(2) then
	l1I1lIl1IIlIIIlIl11I = _G;
end
local function lIlI1ll1l1111lI11I1ll1 (IIIlIlIllIIIlII1Il, l1llI1Il11llIIIIllIl)
	do
		local I1Ill1l1II1lII11II1 = 4294967296;
		local lIIII111llIIlIllII1II;
		do
			local IIlI1I1llIl11llI1Ill = 32;
			local lIl1llI11Ill1I1I11III1 = { 66, 73, 84, 19, 18 };
			local l1l1I1IIIl1I11111lIl = {  };
			for IIIll1Il1I11II11I = 1, # lIl1llI11Ill1I1I11III1 do
				l1l1I1IIIl1I11111lIl[IIIll1Il1I11II11I] = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](lIl1llI11Ill1I1I11III1[IIIll1Il1I11II11I] + IIlI1I1llIl11llI1Ill % 256);
			end
			local l1I111IlIIIlIlI11I1lI;
			local IIl1II1Il1lIlI1Ill1l1 = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(5)];
			if l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(6)](IIl1II1Il1lIlI1Ill1l1) == I111lI1Il1IlI1I1l1II(1) then
				l1I111IlIIIlIlI11I1lI = IIl1II1Il1lIlI1Ill1l1(1);
			end
			if l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(6)](l1I111IlIIIlIlI11I1lI) ~= I111lI1Il1IlI1I1l1II(2) then
				l1I111IlIIIlIlI11I1lI = _G;
			end
			lIIII111llIIlIllII1II = l1I111IlIIIlIlI11I1lI[l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(2)][I111lI1Il1IlI1I1l1II(7)](l1l1I1IIIl1I11111lIl)];
		end
		if lIIII111llIIlIllII1II == nil then
			local function lIlIlIl1Il1II11ll1l1ll (I1llll11I1llI1ll1lII1)
				I1llll11I1llI1ll1lII1 = I1llll11I1llI1ll1lII1 % I1Ill1l1II1lII11II1;
				if I1llll11I1llI1ll1lII1 < 0 then
					I1llll11I1llI1ll1lII1 = I1llll11I1llI1ll1lII1 + I1Ill1l1II1lII11II1;
				end
				return I1llll11I1llI1ll1lII1;
			end
			lIIII111llIIlIllII1II = {  };
			function lIIII111llIIlIllII1II.IIlIIl1I11llII1lIIlI1 (lIIlI1IIIllII1llI1llI, II11ll11Il1l1I1l11Ill)
				lIIlI1IIIllII1llI1llI = lIlIlIl1Il1II11ll1l1ll(lIIlI1IIIllII1llI1llI);
				II11ll11Il1l1I1l11Ill = lIlIlIl1Il1II11ll1l1ll(II11ll11Il1l1I1l11Ill);
				local l11l11ll1IIl11I1lI1II = 0;
				local l1111I1lII1I1Ill1lll = 1;
				for II1lII111llIl1IIlI = 0, 31 do
					local I1lll11IlllI11l11Il11 = lIIlI1IIIllII1llI1llI % 2;
					local I11IIII1lIl1l1lllII = II11ll11Il1l1I1l11Ill % 2;
					if I1lll11IlllI11l11Il11 == 1 and I11IIII1lIl1l1lllII == 1 then
						l11l11ll1IIl11I1lI1II = l11l11ll1IIl11I1lI1II + l1111I1lII1I1Ill1lll;
					end
					lIIlI1IIIllII1llI1llI = lIIlI1IIIllII1llI1llI - I1lll11IlllI11l11Il11 / 2;
					II11ll11Il1l1I1l11Ill = II11ll11Il1l1I1l11Ill - I11IIII1lIl1l1lllII / 2;
					l1111I1lII1I1Ill1lll = l1111I1lII1I1Ill1lll * 2;
				end
				return l11l11ll1IIl11I1lI1II;
			end
			function lIIII111llIIlIllII1II.II1l11111l11Il1ll111 (IIllllIIl1lI111IlIl1I1, l111l1I1IlIll1ll1II1)
				IIllllIIl1lI111IlIl1I1 = lIlIlIl1Il1II11ll1l1ll(IIllllIIl1lI111IlIl1I1);
				l111l1I1IlIll1ll1II1 = lIlIlIl1Il1II11ll1l1ll(l111l1I1IlIll1ll1II1);
				local I1l1IIlllII1IlI1I11II = 0;
				local IIlIII11I11IIIll1l11 = 1;
				for l11lI1l11Il1l111lIlII = 0, 31 do
					local l1IlI1l1111IIIIl1II1l = IIllllIIl1lI111IlIl1I1 % 2;
					local lIIIIlI11ll1l11II1l1 = l111l1I1IlIll1ll1II1 % 2;
					if l1IlI1l1111IIIIl1II1l == 1 or lIIIIlI11ll1l11II1l1 == 1 then
						I1l1IIlllII1IlI1I11II = I1l1IIlllII1IlI1I11II + IIlIII11I11IIIll1l11;
					end
					IIllllIIl1lI111IlIl1I1 = IIllllIIl1lI111IlIl1I1 - l1IlI1l1111IIIIl1II1l / 2;
					l111l1I1IlIll1ll1II1 = l111l1I1IlIll1ll1II1 - lIIIIlI11ll1l11II1l1 / 2;
					IIlIII11I11IIIll1l11 = IIlIII11I11IIIll1l11 * 2;
				end
				return I1l1IIlllII1IlI1I11II;
			end
			function lIIII111llIIlIllII1II.I1lll11lI1lIIIIl11Ill (lIlI1IIl1IIl11l1l11IIl, lIll1IllIII1lIl11IlllI)
				local IIllIl11IIlIl111IIlll = 809;
				IIllIl11IIlIl111IIlll = 809;
				if 1 == 0 then
					local IIIIIlll11I1Il1III11;
				end
				do
					IIllIl11IIlIl111IIlll = IIllIl11IIlIl111IIlll;
				end
				local lIlIl1lI1II11llIlIl1Il = 522;
				lIlIl1lI1II11llIlIl1Il = 522;
				if 1 == 0 then
					local I111I111IlI111IlII1II;
				end
				do
					lIlIl1lI1II11llIlIl1Il = lIlIl1lI1II11llIlIl1Il;
				end
				lIlI1IIl1IIl11l1l11IIl = lIlIlIl1Il1II11ll1l1ll(lIlI1IIl1IIl11l1l11IIl);
				lIll1IllIII1lIl11IlllI = lIlIlIl1Il1II11ll1l1ll(lIll1IllIII1lIl11IlllI);
				local lIlI11l11llIIl1II1IlI = 0;
				local l1II1lI11ll11lIllI11 = 1;
				for I1l111l1IIII1II1I11Il = 0, 31 do
					local I111l1ll1II1II11l111 = lIlI1IIl1IIl11l1l11IIl % 2;
					local lIll1IIIl1llIllll111lI = lIll1IllIII1lIl11IlllI % 2;
					if I111l1ll1II1II11l111 + lIll1IIIl1llIllll111lI == 1 then
						lIlI11l11llIIl1II1IlI = lIlI11l11llIIl1II1IlI + l1II1lI11ll11lIllI11;
					end
					lIlI1IIl1IIl11l1l11IIl = lIlI1IIl1IIl11l1l11IIl - I111l1ll1II1II11l111 / 2;
					lIll1IllIII1lIl11IlllI = lIll1IllIII1lIl11IlllI - lIll1IIIl1llIllll111lI / 2;
					l1II1lI11ll11lIllI11 = l1II1lI11ll11lIllI11 * 2;
				end
				return lIlI11l11llIIl1II1IlI;
			end
			function lIIII111llIIlIllII1II.II11I1lll1IIl111lllI (I11I1l11IIlII1l11IIl)
				return I1Ill1l1II1lII11II1 - 1 - lIlIlIl1Il1II11ll1l1ll(I11I1l11IIlII1l11IIl);
			end
			function lIIII111llIIlIllII1II.IIlI1II11lIIl111l1ll11 (lIlllI1llllIl1ll1l1I11, lIlIl111lI1I1I1IIl1ll)
				local lI11lI111II1II11II = 671;
				lI11lI111II1II11II = 671;
				if 1 == 0 then
					local lIlll1l1lI1IIIlll11ll1;
				end
				do
					lI11lI111II1II11II = lI11lI111II1II11II;
				end
				local l1l1I1l1I11lI1lIlI1l = 720;
				l1l1I1l1I11lI1lIlI1l = 720;
				if 1 == 0 then
					local lI1l1I1lI1IlII11I11lI;
				end
				do
					l1l1I1l1I11lI1lIlI1l = l1l1I1l1I11lI1lIlI1l;
				end
				lIlIl111lI1I1I1IIl1ll = lIlIl111lI1I1I1IIl1ll % 32;
				return lIlIlIl1Il1II11ll1l1ll(lIlllI1llllIl1ll1l1I11) * 2 ^ lIlIl111lI1I1I1IIl1ll % I1Ill1l1II1lII11II1;
			end
			function lIIII111llIIlIllII1II.IIll1IIl1l1I11l1I1lIIl (II111II1I11II1IlIll1, l1lIIll1IllI1l1III11)
				l1lIIll1IllI1l1III11 = l1lIIll1IllI1l1III11 % 32;
				return l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(9)][I111lI1Il1IlI1I1l1II(8)](lIlIlIl1Il1II11ll1l1ll(II111II1I11II1IlIll1) / 2 ^ l1lIIll1IllI1l1III11);
			end
		end
		local function III1IlIIl111Il1IIlII1 (III11l1I111l1II1III1l, IIllIlllIIll11lll1IlI)
			return { III11l1I111l1II1III1l, IIllIlllIIll11lll1IlI };
		end
		local function I1I11l1ll1I11I1lIlI1 (l111111I1IlIIIIII1Il1)
			return { 0, l111111I1IlIIIIII1Il1 % I1Ill1l1II1lII11II1 };
		end
		local function l1IIIIIlllI11IllllI1 (lIl1ll1ll1l11IlIlIl1lI)
			return lIl1ll1ll1l11IlIlIl1lI[2];
		end
		local function lI11l11ll1IIllIllllI (I1I11lIlIlIll11lI11lI, l11lIll1lIl11lI1l1lI)
			local III1I11l11IIlllII1lIl = 979;
			III1I11l11IIlllII1lIl = 979;
			if 1 == 0 then
				local lI1lllllIl111IlIIll11;
			end
			do
				III1I11l11IIlllII1lIl = III1I11l11IIlllII1lIl;
			end
			local l1II11ll11l1IIl1lII1l = 772;
			l1II11ll11l1IIl1lII1l = 772;
			if 1 == 0 then
				local I11ll1111I1111IIIlII1;
			end
			do
				l1II11ll11l1IIl1lII1l = l1II11ll11l1IIl1lII1l;
			end
			local IIllIllIl1111lIlllll11 = I1I11lIlIlIll11lI11lI[2] + l11lIll1lIl11lI1l1lI[2];
			local IIlllI1111III1I11lI1II = 0;
			if IIllIllIl1111lIlllll11 >= I1Ill1l1II1lII11II1 then
				IIllIllIl1111lIlllll11 = IIllIllIl1111lIlllll11 - I1Ill1l1II1lII11II1;
				IIlllI1111III1I11lI1II = 1;
			end
			local IIl1llI1IlIlI11I11l = I1I11lIlIlIll11lI11lI[1] + l11lIll1lIl11lI1l1lI[1] + IIlllI1111III1I11lI1II % I1Ill1l1II1lII11II1;
			return { IIl1llI1IlIlI11I11l, IIllIllIl1111lIlllll11 };
		end
		local function lIl1I1lI1lIIlIIlIll1 (IIl1I1111I1I1Il1l111l, l1Il1lIlI111IIll1lIlI)
			local II11I11IIlI1IllII11Il = IIl1I1111I1I1Il1l111l[1] % l1Il1lIlI111IIll1lIlI * I1Ill1l1II1lII11II1 % l1Il1lIlI111IIll1lIlI + IIl1I1111I1I1Il1l111l[2] % l1Il1lIlI111IIll1lIlI;
			return II11I11IIlI1IllII11Il % l1Il1lIlI111IIll1lIlI;
		end
		local function lIlIIIllIlIl1Ill1ll (lIII11111I111I1lIlII1)
			local lIlllII1I111l1lII1lI1l = lIII11111I111I1lIlII1[1] % 255 + lIII11111I111I1lIlII1[2] % 255;
			return lIlllII1I111l1lII1lI1l % 255;
		end
		local function lIllll11lI1l1IIIIllIlI (lI111111lIlI1I1l1II1l, l11l11lllllIll111llIl)
			return { lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(10)](lI111111lIlI1I1l1II1l[1], l11l11lllllIll111llIl[1]), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(10)](lI111111lIlI1I1l1II1l[2], l11l11lllllIll111llIl[2]) };
		end
		local function IIIl1Il1lllIl11llIIII (IIlIIl11II1lIIIl1lIl1, lIll1I1Il111lIlIl1lIlI)
			return { lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(11)](IIlIIl11II1lIIIl1lIl1[1], lIll1I1Il111lIlIl1lIlI[1]), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(11)](IIlIIl11II1lIIIl1lIl1[2], lIll1I1Il111lIlIl1lIlI[2]) };
		end
		local function IIll111I1I1ll1ll111I1I (l11Illl1llllIlIIII1I1, I1Il111lllIl1I1ll1I1)
			return { lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(12)](l11Illl1llllIlIIII1I1[1], I1Il111lllIl1I1ll1I1[1]), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(12)](l11Illl1llllIlIIII1I1[2], I1Il111lllIl1I1ll1I1[2]) };
		end
		local function I1lIlII1IlI11III1IIl (lI1IIIII11llI1l11llI1)
			local IIll1lIlI1I1Il1III111l = 822;
			IIll1lIlI1I1Il1III111l = 822;
			if 1 == 0 then
				local I1111111l11llIl1IIII;
			end
			do
				IIll1lIlI1I1Il1III111l = IIll1lIlI1I1Il1III111l;
			end
			return { lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(13)](lI1IIIII11llI1l11llI1[1]), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(13)](lI1IIIII11llI1l11llI1[2]) };
		end
		local function II1IllI11lII11ll1I11I (IIlI1ll1Ill1lIIIl1I1Il, lIlIII1IIl11II1I1lIlll)
			lIlIII1IIl11II1I1lIlll = lIlIII1IIl11II1I1lIlll % 64;
			if lIlIII1IIl11II1I1lIlll == 0 then
				return { IIlI1ll1Ill1lIIIl1I1Il[1], IIlI1ll1Ill1lIIIl1I1Il[2] };
			end
			if lIlIII1IIl11II1I1lIlll >= 32 then
				local l11lIlII11l1IIlIIll1 = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(14)](IIlI1ll1Ill1lIIIl1I1Il[2], lIlIII1IIl11II1I1lIlll - 32);
				return { l11lIlII11l1IIlIIll1, 0 };
			end
			local lII1Il1111lIIl1l11l = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(12)](lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(14)](IIlI1ll1Ill1lIIIl1I1Il[1], lIlIII1IIl11II1I1lIlll), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(15)](IIlI1ll1Ill1lIIIl1I1Il[2], 32 - lIlIII1IIl11II1I1lIlll));
			local III1IlI1lIl1IIlI11lII = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(14)](IIlI1ll1Ill1lIIIl1I1Il[2], lIlIII1IIl11II1I1lIlll);
			return { lII1Il1111lIIl1l11l, III1IlI1lIl1IIlI11lII };
		end
		local function lII1I11IlIIl11IlI11I (l1l1llII1lllI1llI1llI, IIlIIIIIlllI111llIlIll)
			IIlIIIIIlllI111llIlIll = IIlIIIIIlllI111llIlIll % 64;
			if IIlIIIIIlllI111llIlIll == 0 then
				return { l1l1llII1lllI1llI1llI[1], l1l1llII1lllI1llI1llI[2] };
			end
			if IIlIIIIIlllI111llIlIll >= 32 then
				local l11ll1IIIIIIIlI11lII = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(15)](l1l1llII1lllI1llI1llI[1], IIlIIIIIlllI111llIlIll - 32);
				return { 0, l11ll1IIIIIIIlI11lII };
			end
			local lIll1I111llIIIlll1l1l1 = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(15)](l1l1llII1lllI1llI1llI[1], IIlIIIIIlllI111llIlIll);
			local l1l1lI1lllI11lI1l1lIl = lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(12)](lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(15)](l1l1llII1lllI1llI1llI[2], IIlIIIIIlllI111llIlIll), lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(14)](l1l1llII1lllI1llI1llI[1], 32 - IIlIIIIIlllI111llIlIll));
			return { lIll1I111llIIIlll1l1l1, l1l1lI1lllI11lI1l1lIl };
		end
		local function l11I1lI11l1llII1I (IIII11lI111lll11lIII, lIl1lI11ll1lIll11I)
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(10)](IIII11lI111lll11lIII, lIl1lI11ll1lIll11I);
		end
		local function lIlll1ll1l1IIll11I1I1 (l11I11III1I111lIlII1, l1I11111ll1II1l1l1Il)
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(11)](l11I11III1I111lIlII1, l1I11111ll1II1l1l1Il);
		end
		local function lIll1lI1I1111I11Il11I (IIlIIIIl1l11ll1l1llll1, IIllIllII1I1I1I1l1l1Il)
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(12)](IIlIIIIl1l11ll1l1llll1, IIllIllII1I1I1I1l1l1Il);
		end
		local function I1lIIll11Ill1Illl (I111lI1ll11llI111IIlI)
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(13)](I111lI1ll11llI111IIlI);
		end
		local function IIll1Ill11lIlI111lII11 (IIllIlIIl1l11III11lI1l, I1II1IIIlll11I1llll11)
			local lIlllIlIlI1l11l1IIIl11 = 620;
			lIlllIlIlI1l11l1IIIl11 = 620;
			if 1 == 0 then
				local l1llll1l1IIII111IlIll;
			end
			do
				lIlllIlIlI1l11l1IIIl11 = lIlllIlIlI1l11l1IIIl11;
			end
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(14)](IIllIlIIl1l11III11lI1l, I1II1IIIlll11I1llll11);
		end
		local function l11I1lIII11I1IlII111l (lIlIll1l1Il11l1Ill1llI, IIlIl1IIlI1lIII111IIl)
			return lIIII111llIIlIllII1II[I111lI1Il1IlI1I1l1II(15)](lIlIll1l1Il11l1Ill1llI, IIlIl1IIlI1lIII111IIl);
		end
		local I11IIl1IIII111IIll1lI = { 175, 51, 99, 120 };
		local lIIII1IlIl1111111IlII = I1I11l1ll1I11I1lIlI1(0);
		for lIllI1IllIl111I1Il1I11 = 1, # I11IIl1IIII111IIll1lI do
			local IIIIlI1llI1l1111l1l11 = I11IIl1IIII111IIll1lI[lIllI1IllIl111I1Il1I11];
			local l11lIIIIIl11l1II11l1I = I1I11l1ll1I11I1lIlI1(IIIIlI1llI1l1111l1l11);
			lIIII1IlIl1111111IlII = lIllll11lI1l1IIIIllIlI(lI11l11ll1IIllIllllI(lIIII1IlIl1111111IlII, l11lIIIIIl11l1II11l1I), IIIl1Il1lllIl11llIIII(II1IllI11lII11ll1I11I(l11lIIIIIl11l1II11l1I, lIllI1IllIl111I1Il1I11 - 1 % 3), I1I11l1ll1I11I1lIlI1(0xff)));
			lIIII1IlIl1111111IlII = IIIl1Il1lllIl11llIIII(lIIII1IlIl1111111IlII, I1I11l1ll1I11I1lIlI1(0xff));
		end
		lIIII1IlIl1111111IlII = lIlIIIllIlIl1Ill1ll(lI11l11ll1IIllIllllI(lIIII1IlIl1111111IlII, I1I11l1ll1I11I1lIlI1(55 + 5)));
		local IIll1IlI1II11IlII1IlII = { 209, 198, 220, 227, 203, 208, 233, 38, 13, 10, 10, 9, 7, 60, 59, 63, 94, 67, 66, 119, 70, 124, 97, 87, 95, 140, 175, 144, 128, 142, 181, 182, 178, 172, 177, 201, 212, 244, 210, 229 };
		local lIl11lIIIlI1l1IIlIlll = 113 + 77 + lIIII1IlIl1111111IlII;
		lIl11lIIIlI1l1IIlIlll = lIl11lIIIlI1l1IIlIlll % 255 + 1;
		local I1lIl1I111I1Il1III11 = {  };
		for I1Il1I11Ill1l1I1IlIll = 1, # IIll1IlI1II11IlII1IlII do
			local IIllIllIllIlIl1l1lll1I = I1Il1I11Ill1l1I1IlIll - 1;
			IIllIllIllIlIl1l1lll1I = IIllIllIllIlIl1l1lll1I * 7;
			IIllIllIllIlIl1l1lll1I = IIllIllIllIlIl1l1lll1I + lIl11lIIIlI1l1IIlIlll;
			IIllIllIllIlIl1l1lll1I = IIllIllIllIlIl1l1lll1I % 255;
			I1lIl1I111I1Il1III11[I1Il1I11Ill1l1I1IlIll] = l11I1lI11l1llII1I(IIll1IlI1II11IlII1IlII[I1Il1I11Ill1l1I1IlIll], IIllIllIllIlIl1l1lll1I);
		end
		local I1lI11IIl1111IlI11lll = I1lIl1I111I1Il1III11[5 - 4];
		local l11I11lIll11l1ll1ll1 = I1lIl1I111I1Il1III11[10 - 8];
		local I111ll1lIlI1I11ll1I = I1lIl1I111I1Il1III11[12 - 9];
		local III1l11I1111I1lI1I1l1 = I1lIl1I111I1Il1III11[9 - 5];
		local III11II11IIl1I1IlIllI = I1lIl1I111I1Il1III11[7 - 2];
		local II11lIIIlI1llI11ll1l = I1lIl1I111I1Il1III11[13 - 7];
		local lI1lI11ll11llll11II = I1lIl1I111I1Il1III11[8 - 1];
		local lII1I1Il1l1I1111IIllI = I1lIl1I111I1Il1III11[12 - 4];
		local IIl1lI1lIlIIIl1ll1I1l = I1lIl1I111I1Il1III11[18 - 9];
		local I1lIIllIIlI1ll1II1llI = I1lIl1I111I1Il1III11[15 - 5];
		local l111l11l1ll1I1IlllIl1 = I1lIl1I111I1Il1III11[16 - 5];
		local lI1IIl1Il111111llIIII = I1lIl1I111I1Il1III11[14 - 2];
		local l1l1IIII1lllIIlI11I1l = I1lIl1I111I1Il1III11[21 - 8];
		local l11lIIll1l1IIl1I1 = I1lIl1I111I1Il1III11[16 - 2];
		local II1Il1l1IIIlI1I1llll = I1lIl1I111I1Il1III11[17 - 2];
		local I1lllIIllIlllII1llI = I1lIl1I111I1Il1III11[25 - 9];
		local l1l11IlllI11lIllll11I = I1lIl1I111I1Il1III11[21 - 4];
		local I111llIl1I11II11IlI1l = I1lIl1I111I1Il1III11[21 - 3];
		local lIllI1111l11IIIIIl1llI = I1lIl1I111I1Il1III11[22 - 3];
		local lI1lIIIlI11Il1lIIl1II = I1lIl1I111I1Il1III11[28 - 8];
		local l1lIlIIll1IlIl1111lI = I1lIl1I111I1Il1III11[27 - 6];
		local lIlI111l1I1ll111IIII11 = I1lIl1I111I1Il1III11[29 - 7];
		local lIlll11lI1111IIllIll1 = I1lIl1I111I1Il1III11[29 - 6];
		local lI111IlI1IlI11lI1I11I = I1lIl1I111I1Il1III11[28 - 4];
		local II1lII1l1lIIlIlII11I = I1lIl1I111I1Il1III11[27 - 2];
		local I1IIl1lIl1II1ll1llIl1 = I1lIl1I111I1Il1III11[30 - 4];
		local I11lIll1111l11Il11lIl = I1lIl1I111I1Il1III11[30 - 3];
		local I1I11ll1lII1I1lIIllIl = I1lIl1I111I1Il1III11[32 - 4];
		local l111lIIll11Il11111lIl = I1lIl1I111I1Il1III11[38 - 9];
		local IIll11111I111l11lIl1Il = I1lIl1I111I1Il1III11[37 - 7];
		local lIlI1l1lllllll111lI1I = I1lIl1I111I1Il1III11[34 - 3];
		local II11IlIlll11I11l1111I = I1lIl1I111I1Il1III11[38 - 6];
		local I11I1I1I111llIII1IIII = I1lIl1I111I1Il1III11[39 - 6];
		local I11I1I1l111lIl11llI11 = I1lIl1I111I1Il1III11[43 - 9];
		local lIlII11II11III1Ill1III = I1lIl1I111I1Il1III11[36 - 1];
		local lIlIII111I1l11llIlI1l = I1lIl1I111I1Il1III11[40 - 4];
		local IIll111Il111lIl1ll11Il = I1lIl1I111I1Il1III11[42 - 5];
		local lI1lI1l1l1IIlll1II1ll = I1lIl1I111I1Il1III11[42 - 4];
		local lIl1llI1I1lll1IllIllIl = I1lIl1I111I1Il1III11[42 - 3];
		local II1lIlIIII1lIIl1I1II = I1lIl1I111I1Il1III11[42 - 2];
		local I1IllIll1II111llIl111 = { 47, 232, 236, 35 };
		local I1lIlllll1lI1II1lIll = l11I1lI11l1llII1I(108, 135) + lIIII1IlIl1111111IlII;
		I1lIlllll1lI1II1lIll = I1lIlllll1lI1II1lIll % 255 + 1;
		local IIll1l1I11lll1IIIl1llI = {  };
		for I1I1II1lIllll11I1lII1 = 1, # I1IllIll1II111llIl111 do
			local l1IlIl11l1IlIII1 = I1I1II1lIllll11I1lII1 - 1;
			l1IlIl11l1IlIII1 = l1IlIl11l1IlIII1 * 13;
			l1IlIl11l1IlIII1 = l1IlIl11l1IlIII1 + I1lIlllll1lI1II1lIll;
			l1IlIl11l1IlIII1 = l1IlIl11l1IlIII1 % 255;
			IIll1l1I11lll1IIIl1llI[I1I1II1lIllll11I1lII1] = l11I1lI11l1llII1I(I1IllIll1II111llIl111[I1I1II1lIllll11I1lII1], l1IlIl11l1IlIII1);
		end
		local II1lIII11llll1l11l1l = # IIll1l1I11lll1IIIl1llI;
		local IIll1lIIlIIIIlIIl1l1l = { { 4, I111lI1Il1IlI1I1l1II(16) .. I111lI1Il1IlI1I1l1II(17) }, { 4, I111lI1Il1IlI1I1l1II(18) .. I111lI1Il1IlI1I1l1II(19) .. I111lI1Il1IlI1I1l1II(20) }, { 4, I111lI1Il1IlI1I1l1II(16) .. I111lI1Il1IlI1I1l1II(21) .. I111lI1Il1IlI1I1l1II(22) }, { 0, I111lI1Il1IlI1I1l1II(23) }, { 3, I111lI1Il1IlI1I1l1II(24) } };
		local lIlIlI11IlI1IlIl1lllI = { 122, 135, 180, 50, 122, 242, 232, 140, 93 };
		local lIllI1Il11I1II1l1IIlII = {  };
		local I1lI1lll1I1I1lI111l1 = {  };
		local l11IlIl111IIllII1l111 = {  };
		local IIlIII11ll1lI1ll1llIII = l11I1lI11l1llII1I(96, 160) + lIIII1IlIl1111111IlII;
		IIlIII11ll1lI1ll1llIII = IIlIII11ll1lI1ll1llIII % 255 + 1;
		for I1lll1II1l11l1l1Il1I1 = 1, # lIlIlI11IlI1IlIl1lllI do
			local I11l1II111lI1llll1l1 = I1lll1II1l11l1l1Il1I1 - 1;
			I11l1II111lI1llll1l1 = I11l1II111lI1llll1l1 * 11;
			I11l1II111lI1llll1l1 = I11l1II111lI1llll1l1 + IIlIII11ll1lI1ll1llIII;
			I11l1II111lI1llll1l1 = I11l1II111lI1llll1l1 % 255;
			lIllI1Il11I1II1l1IIlII[I1lll1II1l11l1l1Il1I1] = l11I1lI11l1llII1I(lIlIlI11IlI1IlIl1lllI[I1lll1II1l11l1l1Il1I1], I11l1II111lI1llll1l1);
		end
		local I1Il1l11lIl1lllI1IIl1 = # lIllI1Il11I1II1l1IIlII;
		local IIlIIIllI1l1llIII1llI = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(25)];
		local function l1II1lllllIlIlIl1IllI (IIlIIl1lI1ll1lIlIIlIII)
			if l11IlIl111IIllII1l111[IIlIIl1lI1ll1lIlIIlIII] then
				return I1lI1lll1I1I1lI111l1[IIlIIl1lI1ll1lIlIIlIII];
			end
			l11IlIl111IIllII1l111[IIlIIl1lI1ll1lIlIIlIII] = true;
			local IIlllllIl1I1II11II1lI = IIll1lIIlIIIIlIIl1l1l[IIlIIl1lI1ll1lIlIIlIII];
			if not IIlllllIl1I1II11II1lI then
				return nil;
			end
			local lIIl11II1lIII1Il111l1 = IIlllllIl1I1II11II1lI[1];
			local lIll1IllI11l11II1IlI1I = IIlllllIl1I1II11II1lI[2];
			local lIl111II11111l1I1IlIl = {  };
			for IIIlllI1lI1lI1lIlIII = 1, # lIll1IllI11l11II1IlI1I do
				local IIlllIIIII1l1lllI1lII1 = IIIlllI1lI1lI1lIlIII - 1 % I1Il1l11lIl1lllI1IIl1 + 1;
				local lIllIIIll1l11l1I1I = IIlIIIllI1l1llIII1llI(lIll1IllI11l11II1IlI1I, IIIlllI1lI1lI1lIlIII) - lIllI1Il11I1II1l1IIlII[IIlllIIIII1l1lllI1lII1];
				if lIllIIIll1l11l1I1I < 0 then
					lIllIIIll1l11l1I1I = lIllIIIll1l11l1I1I + 256;
				end
				lIl111II11111l1I1IlIl[IIIlllI1lI1lI1lIlIII] = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](lIllIIIll1l11l1I1I);
			end
			local IIlIl1IIll1I111lllIl1l = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(2)][I111lI1Il1IlI1I1l1II(7)](lIl111II11111l1I1IlIl);
			local IIl1llll1Il111II1IlllI;
			if lIIl11II1lIII1Il111l1 == 0 then
				IIl1llll1Il111II1IlllI = nil;
			elseif lIIl11II1lIII1Il111l1 == 1 then
				IIl1llll1Il111II1IlllI = false;
			elseif lIIl11II1lIII1Il111l1 == 2 then
				IIl1llll1Il111II1IlllI = true;
			elseif lIIl11II1lIII1Il111l1 == 3 then
				IIl1llll1Il111II1IlllI = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(26)](IIlIl1IIll1I111lllIl1l);
			else
				IIl1llll1Il111II1IlllI = IIlIl1IIll1I111lllIl1l;
			end
			I1lI1lll1I1I1lI111l1[IIlIIl1lI1ll1lIlIIlIII] = IIl1llll1Il111II1IlllI;
			return IIl1llll1Il111II1IlllI;
		end
		local IIlIIlIIIl11Ill1lIII1 = { IIIlIlIllIIIlII1Il, l1llI1Il11llIIIIllIl };
		local lIllI1III1l11111l11I1l = {  };
		local lIllIII1lllII11llI1II = 0;
		local IIlII11llIIIlI1I1l11l;
		local III11II11Il1IIll1I111 = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(5)];
		if l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(6)](III11II11Il1IIll1I111) == I111lI1Il1IlI1I1l1II(1) then
			IIlII11llIIIlI1I1l11l = III11II11Il1IIll1I111(1);
		end
		if l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(6)](IIlII11llIIIlI1I1l11l) ~= I111lI1Il1IlI1I1l1II(2) then
			IIlII11llIIIlI1I1l11l = _G;
		end
		local I1111lIIIlIlIlI1III = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(2)][I111lI1Il1IlI1I1l1II(27)];
		if I1111lIIIlIlIlI1III == nil then
			I1111lIIIlIlIlI1III = function (...)
				return { [ I111lI1Il1IlI1I1l1II(30) ] = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(29)](I111lI1Il1IlI1I1l1II(28), ...), ... };
			end;
		end
		local I11lIIllllIII1II1I1Il = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(2)][I111lI1Il1IlI1I1l1II(31)];
		if I11lIIllllIII1II1I1Il == nil then
			local function IIIIII1lll1II11lI11lI (IIlII1lI1IllIl11lI1Ill, lIll1ll1Il1IIIll1IlI1I, lIlIlI1llIIlIlllI1lII1)
				lIll1ll1Il1IIIll1IlI1I = lIll1ll1Il1IIIll1IlI1I or 1;
				lIlIlI1llIIlIlllI1lII1 = lIlIlI1llIIlIlllI1lII1 or IIlII1lI1IllIl11lI1Ill[I111lI1Il1IlI1I1l1II(30)] or # IIlII1lI1IllIl11lI1Ill;
				if lIll1ll1Il1IIIll1IlI1I > lIlIlI1llIIlIlllI1lII1 then
					return;
				end
				return IIlII1lI1IllIl11lI1Ill[lIll1ll1Il1IIIll1IlI1I], IIIIII1lll1II11lI11lI(IIlII1lI1IllIl11lI1Ill, lIll1ll1Il1IIIll1IlI1I + 1, lIlIlI1llIIlIlllI1lII1);
			end
			I11lIIllllIII1II1I1Il = IIIIII1lll1II11lI11lI;
		end
		local II11Il1ll1llII1ll1l1 = { l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](252, 46, 63, 80, 131, 114, 131, 148, 70, 182, 199, 216, 31, 250, 11, 28, 219, 62, 79, 96, 133, 130, 147, 164, 184, 198, 215, 232, 255, 10, 27, 44, 59, 78, 95, 112, 85, 146, 163, 180, 20, 214, 231, 248, 219, 26, 43, 60, 189, 94, 111, 128, 114, 162, 179, 196, 54, 230, 247, 8) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](201, 42, 59, 76, 169, 110, 127, 144, 85, 178, 195, 212, 242, 246, 7, 24, 46, 58, 75, 92, 107, 126, 143, 160, 97, 194, 211, 228, 36, 6, 23, 40, 235, 74, 91, 108, 137, 142, 159, 176, 34, 210, 227, 244, 230, 22, 39, 56, 153, 90, 107, 124, 121, 158, 175, 192, 37, 226, 243, 4) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](2, 38, 55, 72, 93, 106, 123, 140, 155, 174, 191, 208, 49, 242, 3, 20, 246, 54, 71, 88, 187, 122, 139, 156, 76, 190, 207, 224, 16, 2, 19, 36, 214, 70, 87, 104, 172, 138, 155, 172, 73, 206, 223, 240, 245, 18, 35, 52, 84, 86, 103, 120, 143, 154, 171, 188, 203, 222, 239, 0) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](197, 34, 51, 68, 131, 102, 119, 136, 75, 170, 187, 204, 25, 238, 255, 16, 193, 50, 67, 84, 134, 118, 135, 152, 95, 186, 203, 220, 29, 254, 15, 32, 197, 66, 83, 100, 81, 134, 151, 168, 190, 202, 219, 236, 248, 14, 31, 48, 149, 82, 99, 116, 80, 150, 167, 184, 27, 218, 235, 252) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](232, 30, 47, 64, 180, 98, 115, 132, 118, 166, 183, 200, 43, 234, 251, 12, 236, 46, 63, 80, 149, 114, 131, 148, 161, 182, 199, 216, 234, 250, 11, 28, 43, 62, 79, 96, 161, 130, 147, 164, 97, 198, 215, 232, 43, 10, 27, 44, 220, 78, 95, 112, 101, 146, 163, 180, 38, 214, 231, 248) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](223, 26, 43, 60, 187, 94, 111, 128, 103, 162, 179, 196, 213, 230, 247, 8, 22, 42, 59, 76, 91, 110, 127, 144, 117, 178, 195, 212, 63, 246, 7, 24, 251, 58, 75, 92, 140, 126, 143, 160, 90, 194, 211, 228, 22, 6, 23, 40, 220, 74, 91, 108, 141, 142, 159, 176, 53, 210, 227, 244) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](15, 22, 39, 56, 79, 90, 107, 124, 139, 158, 175, 192), l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](28, 226, 243, 4, 238, 38, 55, 72, 139, 106, 123, 140, 100, 174, 191, 208, 2, 242, 3, 20, 198, 54, 71, 88, 159, 122, 139, 156, 81, 190, 207, 224, 5, 2, 19, 36, 53, 70, 87, 104, 120, 138, 155, 172, 187, 206, 223, 240, 209, 18, 35, 52, 148, 86, 103, 120, 91, 154, 171, 188) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](44, 222, 239, 0, 251, 34, 51, 68, 182, 102, 119, 136, 102, 170, 187, 204, 41, 238, 255, 16, 213, 50, 67, 84, 101, 118, 135, 152, 172, 186, 203, 220, 235, 254, 15, 32, 235, 66, 83, 100, 176, 134, 151, 168, 107, 202, 219, 236, 4, 14, 31, 48, 162, 82, 99, 116, 102, 150, 167, 184) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](63, 218, 235, 252, 250, 30, 47, 64, 165, 98, 115, 132, 130, 166, 183, 200, 218, 234, 251, 12, 27, 46, 63, 80, 161, 114, 131, 148, 119, 182, 199, 216, 59, 250, 11, 28, 203, 62, 79, 96, 166, 130, 147, 164, 86, 198, 215, 232, 23, 10, 27, 44, 201, 78, 95, 112, 117, 146, 163, 180) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](193, 214, 231, 248, 11, 26, 43, 60, 75, 94, 111, 128, 82, 162, 179, 196, 5, 230, 247, 8, 203, 42, 59, 76, 163, 110, 127, 144, 66, 178, 195, 212, 6, 246, 7, 24, 205, 58, 75, 92, 152, 126, 143, 160, 69, 194, 211, 228, 251, 6, 23, 40, 10, 74, 91, 108, 123, 142, 159, 176) .. l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(3)](9, 210, 227, 244, 215, 22, 39, 56, 155, 90, 107, 124, 108, 158, 175, 192, 49, 226, 243, 4, 246, 38, 55, 72, 189, 106, 123, 140, 104, 174, 191, 208, 21, 242, 3, 20, 51, 54, 71, 88, 111, 122, 139, 156, 171, 190, 207, 224) };
		local IIlIlI1lIlI1llIl1l11lI = { 1, 2 };
		local lIlI1llI11I1I11IIII11 = {  };
		for lI1IIllII1Illl1Illll1 = 1, # IIlIlI1lIlI1llIl1l11lI do
			lIlI1llI11I1I11IIII11[lI1IIllII1Illl1Illll1] = II11Il1ll1llII1ll1l1[IIlIlI1lIlI1llIl1l11lI[lI1IIllII1Illl1Illll1]];
		end
		local I1Il1lIlIIlIllI11IlII = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(2)][I111lI1Il1IlI1I1l1II(7)](lIlI1llI11I1I11IIII11);
		local IIllllllIIIII11IlI1lI1 = 80 + 186 + lIIII1IlIl1111111IlII;
		IIllllllIIIII11IlI1lI1 = IIllllllIIIII11IlI1lI1 % 255 + 1;
		local lIll1lllIlI11I1ll11 = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(4)][I111lI1Il1IlI1I1l1II(25)];
		local function lIl11lIIl11lll1I11lIl (I11lll1lllIl1I1lll1l1)
			local IIl11ll1llI1l111l1IIl = lIll1lllIlI11I1ll11(I1Il1lIlIIlIllI11IlII, I11lll1lllIl1I1lll1l1);
			local lIlll1lll1IlllllIIIIIl = I11lll1lllIl1I1lll1l1 - 1;
			lIlll1lll1IlllllIIIIIl = lIlll1lll1IlllllIIIIIl * 17;
			lIlll1lll1IlllllIIIIIl = lIlll1lll1IlllllIIIIIl + IIllllllIIIII11IlI1lI1;
			lIlll1lll1IlllllIIIIIl = lIlll1lll1IlllllIIIIIl % 256;
			return l11I1lI11l1llII1I(IIl11ll1llI1l111l1IIl, lIlll1lll1IlllllIIIIIl);
		end
		local function II1l1lI1II11IIl1I11l (IIl111III1lIIIIl1Illl)
			local l1IIlIll1I1lIIlI11llI = lIl11lIIl11lll1I11lIl(IIl111III1lIIIIl1Illl);
			local II1lIIIlIIll1ll1I1l1l = lIl11lIIl11lll1I11lIl(IIl111III1lIIIIl1Illl + 1);
			local lIlI1I1ll1lI111I11lIII = lIl11lIIl11lll1I11lIl(IIl111III1lIIIIl1Illl + 2);
			local lIlllIIlI11II1Il1I1llI = lIl11lIIl11lll1I11lIl(IIl111III1lIIIIl1Illl + 3);
			return l1IIlIll1I1lIIlI11llI + II1lIIIlIIll1ll1I1l1l * 256 + lIlI1I1ll1lI111I11lIII * 65536 + lIlllIIlI11II1Il1I1llI * 16777216;
		end
		local function IIll1ll1I1IllIl1II1llI (l1l1IlIllIl11II11IlI)
			local l1II1IIIIllIl11llI1l = 416;
			l1II1IIIIllIl11llI1l = 416;
			if 1 == 0 then
				local lIlIl11lII1IIllI111IIl;
			end
			do
				l1II1IIIIllIl11llI1l = l1II1IIIIllIl11llI1l;
			end
			local lIlIIlI1IlI1I11l1lIlI1 = l1l1IlIllIl11II11IlI - 1;
			lIlIIlI1IlI1I11l1lIlI1 = lIlIIlI1IlI1I11l1lIlI1 * 12 + 1;
			local l11l1111I11l1llI11l1I = II1l1lI1II11IIl1I11l(lIlIIlI1IlI1I11l1lIlI1);
			local l1ll11I1llIl1lIl1II1I = II1l1lI1II11IIl1I11l(lIlIIlI1IlI1I11l1lIlI1 + 4);
			local IIl1lllllll111l1I11ll1 = II1l1lI1II11IIl1I11l(lIlIIlI1IlI1I11l1lIlI1 + 8);
			return l11l1111I11l1llI11l1I, l1ll11I1llIl1lIl1II1I, IIl1lllllll111l1I11ll1;
		end
		local II1ll11llIlIlIIIlII1l = 1;
		while true do
			local l1Il1I111lI1111l1I11, lIl1lIl1lllIlIl111II, IIl1lll1111II1lIIllll1 = IIll1ll1I1IllIl1II1llI(II1ll11llIlIlIIIlII1l);
			local lIll1IlllI1111l111IIIl = 0;
			if II1lIII11llll1l11l1l > 0 then
				local IIIIlI11IllIl1llllll1 = II1ll11llIlIlIIIlII1l + lIIII1IlIl1111111IlII - 1;
				IIIIlI11IllIl1llllll1 = IIIIlI11IllIl1llllll1 % II1lIII11llll1l11l1l;
				IIIIlI11IllIl1llllll1 = IIIIlI11IllIl1llllll1 + 1;
				lIll1IlllI1111l111IIIl = IIll1l1I11lll1IIIl1llI[IIIIlI11IllIl1llllll1];
				l1Il1I111lI1111l1I11 = l11I1lI11l1llII1I(l1Il1I111lI1111l1I11, lIll1IlllI1111l111IIIl);
				lIl1lIl1lllIlIl111II = l11I1lI11l1llII1I(lIl1lIl1lllIlIl111II, lIll1IlllI1111l111IIIl);
				IIl1lll1111II1lIIllll1 = l11I1lI11l1llII1I(IIl1lll1111II1lIIllll1, lIll1IlllI1111l111IIIl);
			end
			if l1Il1I111lI1111l1I11 == I1lI11IIl1111IlI11lll then
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l11I11lIll11l1ll1ll1 then
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = l1II1lllllIlIlIl1IllI(lIl1lIl1lllIlIl111II);
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I111ll1lIlI1I11ll1I then
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = IIlIIlIIIl11Ill1lIII1[lIl1lIl1lllIlIl111II];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == III1l11I1111I1lI1I1l1 then
				IIlIIlIIIl11Ill1lIII1[lIl1lIl1lllIlIl111II] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == III11II11IIl1I1IlIllI then
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = IIlII11llIIIlI1I1l11l[l1II1lllllIlIlIl1IllI(lIl1lIl1lllIlIl111II)];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == II11lIIIlI1llI11ll1l then
				IIlII11llIIIlI1I1l11l[l1II1lllllIlIlIl1IllI(lIl1lIl1lllIlIl111II)] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lI1lI11ll11llll11II then
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = {  };
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lII1I1Il1l1I1111IIllI then
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == IIl1lI1lIlIIIl1ll1I1l then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I1lIIllIIlI1ll1II1llI then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l111l11l1ll1I1IlllIl1 then
				local l11lllIl11l1ll1IlIlI = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				local lI11IlIIllIIllIIll1ll = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lI11IlIIllIIllIIll1ll[l11lllIl11l1ll1IlIlI];
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lI1IIl1Il111111llIIII then
				local lIlIl111llI11IllI1ll11 = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				local lIlI1lIl1IIlI11lIIlIl = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = nil;
				local I1IlllIIIIllI1llIIl11 = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 2];
				I1IlllIIIIllI1llIIl11[lIlI1lIl1IIlI11lIIlIl] = lIlIl111llI11IllI1ll11;
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 2] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 3;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l1l1IIII1lllIIlI11I1l then
				local I11IIIIl1lIIll11IIlII = lIl1lIl1lllIlIl111II;
				local lI1IIlll111llll1Il1ll = IIl1lll1111II1lIIllll1;
				local lI1lI1IlIl111lI1l11ll = lIllIII1lllII11llI1II - I11IIIIl1lIIll11IIlII;
				local I1Illl1Il1IIlllIIlll1 = lIllI1III1l11111l11I1l[lI1lI1IlIl111lI1l11ll];
				if lI1IIlll111llll1Il1ll == 0 then
					I1Illl1Il1IIlllIIlll1(I11lIIllllIII1II1I1Il(lIllI1III1l11111l11I1l, lI1lI1IlIl111lI1l11ll + 1, lIllIII1lllII11llI1II))
					for IIl1l1llI1111lII111ll = lIllIII1lllII11llI1II, lI1lI1IlIl111lI1l11ll, - 1 do
						lIllI1III1l11111l11I1l[IIl1l1llI1111lII111ll] = nil;
					end
					lIllIII1lllII11llI1II = lI1lI1IlIl111lI1l11ll - 1;
				else
					local lIl11I1I1IIIl1ll11III = I1111lIIIlIlIlI1III(I1Illl1Il1IIlllIIlll1(I11lIIllllIII1II1I1Il(lIllI1III1l11111l11I1l, lI1lI1IlIl111lI1l11ll + 1, lIllIII1lllII11llI1II)));
					for I1I1I1l1ll1II11I1lll1 = lIllIII1lllII11llI1II, lI1lI1IlIl111lI1l11ll, - 1 do
						lIllI1III1l11111l11I1l[I1I1I1l1ll1II11I1lll1] = nil;
					end
					lIllIII1lllII11llI1II = lI1lI1IlIl111lI1l11ll - 1;
					if lI1IIlll111llll1Il1ll == 1 then
						lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
						lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = lIl11I1I1IIIl1ll11III[1];
					else
						for IIIlIIlII11IllII1IIII = 1, lI1IIlll111llll1Il1ll do
							lIllIII1lllII11llI1II = lIllIII1lllII11llI1II + 1;
							lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = lIl11I1I1IIIl1ll11III[IIIlIIlII11IllII1IIII];
						end
					end
				end
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l11lIIll1l1IIl1I1 then
				local I1llll1IllI1I1IIlIII1 = lIl1lIl1lllIlIl111II;
				if I1llll1IllI1I1IIlIII1 == 0 then
					return;
				elseif I1llll1IllI1I1IIlIII1 == 1 then
					return lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				else
					local II11lI1lI1IIl1llI11Il = lIllIII1lllII11llI1II - I1llll1IllI1I1IIlIII1 + 1;
					return I11lIIllllIII1II1I1Il(lIllI1III1l11111l11I1l, II11lI1lI1IIl1llI11Il, lIllIII1lllII11llI1II);
				end
			elseif l1Il1I111lI1111l1I11 == II1Il1l1IIIlI1I1llll then
				II1ll11llIlIlIIIlII1l = lIl1lIl1lllIlIl111II;
			elseif l1Il1I111lI1111l1I11 == I1lllIIllIlllII1llI then
				if not lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] then
					II1ll11llIlIlIIIlII1l = lIl1lIl1lllIlIl111II;
				else
					II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
				end
			elseif l1Il1I111lI1111l1I11 == l1l11IlllI11lIllll11I then
				if lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] then
					II1ll11llIlIlIIIlII1l = lIl1lIl1lllIlIl111II;
				else
					II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
				end
			elseif l1Il1I111lI1111l1I11 == I111llIl1I11II11IlI1l then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] + lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIllI1111l11IIIIIl1llI then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] - lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lI1lIIIlI11Il1lIIl1II then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] * lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l1lIlIIll1IlIl1111lI then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] / lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIlI111l1I1ll111IIII11 then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(9)][I111lI1Il1IlI1I1l1II(8)](lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] / lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIlll11lI1111IIllIll1 then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] % lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lI111IlI1IlI11lI1I11I then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] ^ lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == II1lII1l1lIIlIlII11I then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] .. lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I1IIl1lIl1II1ll1llIl1 then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] == lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I11lIll1111l11Il11lIl then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] ~= lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I1I11ll1lII1I1lIIllIl then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] < lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == l111lIIll11Il11111lIl then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] <= lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == IIll11111I111l11lIl1Il then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] > lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIlI1l1lllllll111lI1I then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] >= lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == II11IlIlll11I11l1111I then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIlll1ll1l1IIll11I1I1(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I11I1I1I111llIII1IIII then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = lIll1lI1I1111I11Il11I(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == I11I1I1l111lIl11llI11 then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = l11I1lI11l1llII1I(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIlII11II11III1Ill1III then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = IIll1Ill11lIlI111lII11(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIlIII111I1l11llIlI1l then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1] = l11I1lIII11I1IlII111l(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II - 1], lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = nil;
				lIllIII1lllII11llI1II = lIllIII1lllII11llI1II - 1;
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == IIll111Il111lIl1ll11Il then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = - lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lI1lI1l1l1IIlll1II1ll then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = not lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == lIl1llI1I1lll1IllIllIl then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = # lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II];
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			elseif l1Il1I111lI1111l1I11 == II1lIlIIII1lIIl1I1II then
				lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II] = I1lIIll11Ill1Illl(lIllI1III1l11111l11I1l[lIllIII1lllII11llI1II]);
				II1ll11llIlIlIIIlII1l = II1ll11llIlIlIIIlII1l + 1;
			else
				return;
			end
		end
	end
end
l1I1lIl1IIlIIIlIl11I[I111lI1Il1IlI1I1l1II(32)](lIlI1ll1l1111lI11I1ll1(2, 6))