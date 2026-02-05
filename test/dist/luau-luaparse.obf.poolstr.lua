do
	local function I11lIl1l11I1lIl1I1I (l11ll11l1lI11111l)
		error(l11ll11l1lI11111l, 0)
	end
	local lIlllIIII1IIlI111I1lIl = type;
	if lIlllIIII1IIlI111I1lIl == nil then
		I11lIl1l11I1lIl1I1I("Integrity check failed")
	end
	local function lIllI11l1I1lll1llI11Il ()
		local lI1lI1IIlI1lI1l1lIIIl;
		local I1IIlllIlIIIIlI1I1Il1 = getfenv;
		if lIlllIIII1IIlI111I1lIl(I1IIlllIlIIIIlI1I1Il1) == "function" then
			lI1lI1IIlI1lI1l1lIIIl = I1IIlllIlIIIIlI1I1Il1(1);
		end
		if lIlllIIII1IIlI111I1lIl(lI1lI1IIlI1lI1l1lIIIl) ~= "table" then
			lI1lI1IIlI1lI1l1lIIIl = _G;
		end
		local l1l11I1I1I111III111l1 = getmetatable;
		if lIlllIIII1IIlI111I1lIl(l1l11I1I1I111III111l1) == "function" then
			local IIII11l11Illl1l1l1IIl = l1l11I1I1I111III111l1(lI1lI1IIlI1lI1l1lIIIl);
			if IIII11l11Illl1l1l1IIl ~= nil then
				local lIllI11llIlIIlI11II11l = _G;
				if lIlllIIII1IIlI111I1lIl(lIllI11llIlIIlI11II11l) == "table" then
					lI1lI1IIlI1lI1l1lIIIl = lIllI11llIlIIlI11II11l;
				end
			end
		end
		return lI1lI1IIlI1lI1l1lIIIl;
	end
	local function lIlIll1lllIlIIl11 ()
		local lIlIIlII11ll1l1Il111ll = lIllI11l1I1lll1llI11Il();
		if lIlllIIII1IIlI111I1lIl(lIlIIlII11ll1l1Il111ll) ~= "table" then
			I11lIl1l11I1lIl1I1I("Integrity check failed")
		end
		local IIlIllIIl111I11111Illl = debug;
		if lIlllIIII1IIlI111I1lIl(IIlIllIIl111I11111Illl) == "table" then
			local lI11I1I1lI1Il1I1ll11 = IIlIllIIl111I11111Illl.I11I111ll1III1I1llI11;
			if lIlllIIII1IIlI111I1lIl(lI11I1I1lI1Il1I1ll11) == "function" then
				local I1Ill1I1IIIllI1IIll, IIlIIIlIlI11llll1I1lI1 = pcall(lI11I1I1lI1Il1I1ll11);
				if I1Ill1I1IIIllI1IIll and IIlIIIlIlI11llll1I1lI1 ~= nil then
					I11lIl1l11I1lIl1I1I("Integrity check failed")
				end
			end
		end
		local l1lI1I1l11I11lIl = getmetatable;
		if lIlllIIII1IIlI111I1lIl(l1lI1I1l11I11lIl) == "function" then
			local I11111I11I1Il1lIlIll1 = l1lI1I1l11I11lIl(lIlIIlII11ll1l1Il111ll);
			if I11111I11I1Il1lIlIll1 ~= nil then
				I11lIl1l11I1lIl1I1I("Integrity check failed")
			end
		end
	end
	lIlIll1lllIlIIl11()
	local l1l11IIIl1Il1llIllIll = false;
	if l1l11IIIl1Il1llIllIll then
		local I11IllllIl1lllllIlI = setmetatable;
		if lIlllIIII1IIlI111I1lIl(I11IllllIl1lllllIlI) == "function" then
			local I1lI1111lI1I1IIIll1l = lIllI11l1I1lll1llI11Il();
			local l1l1IIlIIIll1IllIII1I = getmetatable(I1lI1111lI1I1IIIll1l);
			if l1l1IIlIIIll1IllIII1I == nil then
				l1l1IIlIIIll1IllIII1I = {  };
				I11IllllIl1lllllIlI(I1lI1111lI1I1IIIll1l, l1l1IIlIIIll1IllIII1I)
			end
			if l1l1IIlIIIll1IllIII1I.l1IllII111ll111IlI1l == nil then
				l1l1IIlIIIll1IllIII1I.l1IllII111ll111IlI1l = "locked";
			end
			if l1l1IIlIIIll1IllIII1I.IIlIIl1lII1IlI111l1llI == nil then
				l1l1IIlIIIll1IllIII1I.IIlIIl1lII1IlI111l1llI = function ()
					error("Runtime integrity violation", 0)
				end;
			end
		end
	end
end
local IIIl111llI1II1lIlI = { "\009\081\026\244\254\149\118\170", "\023\061\014\253\239", "\006\068\013\003", "\022\080\030\250\248\147", "\010\065\032\247\239\154\125", "\023\085\028\246", "\006\075\026\244\235\160", "\009\072\027\000\252", "\016\061\032\249", "\005\084\027\003", "\005\061\026\245", "\005\075\030", "\005\074\027\005", "\015\079\020\250\240\160", "\021\079\020\250\240\160", "\255\012", "\212\016\008\195\186\093\099\110\044\150", "\255\012\221", "\211", "\255\013\228\200\230\094\055\114", "\213\016\008\194\194\099\099\109\053", "\218\056\220\198\187\136\057\112\051", "", "\255\014\221\200\230\093\058\116", "\005\085\032\246", "\023\075\026\006\247\142\108\174", "\019\061\015\252", "\024\074\028\242\237\151", "\019\078\021\255\254" };
local II1lllIll11I11IlII1lI = { 163, 220, 172, 145, 138, 44, 7, 60, 252, 99, 55, 201, 146, 112 };
local I11II1Ill1IIll11II1lI = string.byte;
local lIl1II1lI1lIl11I11111 = {  };
local function IIllIlIIII1lIlI1IlI1Il (l1I11IlIlII11l111llI1)
	local IIlIllIIllI11III1lII11 = lIl1II1lI1lIl11I11111[l1I11IlIlII11l111llI1];
	if IIlIllIIllI11III1lII11 ~= nil then
		return IIlIllIIllI11III1lII11;
	end
	local l11ll1IIl1111Il1II111 = IIIl111llI1II1lIlI[l1I11IlIlII11l111llI1];
	local lIIIIll11IlI11Il1I1I = {  };
	local I11I1ll1lIl1111lIlI1 = # II1lllIll11I11IlII1lI;
	for IIll11l1IIIlI11ll1lIll = 1, # l11ll1IIl1111Il1II111 do
		local IIIIll1l1II1III11Illl = IIll11l1IIIlI11ll1lIll - 1;
		IIIIll1l1II1III11Illl = IIIIll1l1II1III11Illl % I11I1ll1lIl1111lIlI1;
		IIIIll1l1II1III11Illl = IIIIll1l1II1III11Illl + 1;
		local l11lI111lI11lllI11III = I11II1Ill1IIll11II1lI(l11ll1IIl1111Il1II111, IIll11l1IIIlI11ll1lIll) - II1lllIll11I11IlII1lI[IIIIll1l1II1III11Illl];
		if l11lI111lI11lllI11III < 0 then
			l11lI111lI11lllI11III = l11lI111lI11lllI11III + 256;
		end
		lIIIIll11IlI11Il1I1I[IIll11l1IIIlI11ll1lIll] = string.char(l11lI111lI11lllI11III);
	end
	local lIllIl1III1lIl1lI1I1l1 = table.concat(lIIIIll11IlI11Il1I1I);
	lIl1II1lI1lIl11I11111[l1I11IlIlII11l111llI1] = lIllIl1III1lIl1lI1I1l1;
	return lIllIl1III1lIl1lI1I1l1;
end
local lI1I111IIll1IIllII11I = nil;
local I111lIlIll1I1l1IllII1 = getfenv;
if type(I111lIlIll1I1l1IllII1) == IIllIlIIII1lIlI1IlI1Il(1) then
	lI1I111IIll1IIllII11I = I111lIlIll1I1l1IllII1(1);
end
if type(lI1I111IIll1IIllII11I) ~= IIllIlIIII1lIlI1IlI1Il(2) then
	lI1I111IIll1IIllII11I = _G;
end
local function IIlIIll1lI1l111lI11l (II1II111l11l11, I1111l1IlI111lIlI1lI1)
	do
		local I111IIlII1I1llII1I1Il = 4294967296;
		local I1Il1IIl1I1l1I1IlIl1I;
		do
			local IIlI1lIIl11l1IlI11l111 = 32;
			local IIllIlIlIl1I11l1ll1I = { 66, 73, 84, 19, 18 };
			local III1lI1llIllI1IIlI1I1 = {  };
			for I1IlI1lI1I111IlIIII1l = 1, # IIllIlIlIl1I11l1ll1I do
				III1lI1llIllI1IIlI1I1[I1IlI1lI1I111IlIIII1l] = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](IIllIlIlIl1I11l1ll1I[I1IlI1lI1I111IlIIII1l] + IIlI1lIIl11l1IlI11l111 % 256);
			end
			local lIllI1lI1lIIlllIllIlIl;
			local I1III1llI11llll1l1111 = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(5)];
			if lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(6)](I1III1llI11llll1l1111) == IIllIlIIII1lIlI1IlI1Il(1) then
				lIllI1lI1lIIlllIllIlIl = I1III1llI11llll1l1111(1);
			end
			if lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(6)](lIllI1lI1lIIlllIllIlIl) ~= IIllIlIIII1lIlI1IlI1Il(2) then
				lIllI1lI1lIIlllIllIlIl = _G;
			end
			I1Il1IIl1I1l1I1IlIl1I = lIllI1lI1lIIlllIllIlIl[lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(2)][IIllIlIIII1lIlI1IlI1Il(7)](III1lI1llIllI1IIlI1I1)];
		end
		if I1Il1IIl1I1l1I1IlIl1I == nil then
			local function l1III11Il1II1I11II1 (IIlI1lI11l1ll11II11ll)
				IIlI1lI11l1ll11II11ll = IIlI1lI11l1ll11II11ll % I111IIlII1I1llII1I1Il;
				if IIlI1lI11l1ll11II11ll < 0 then
					IIlI1lI11l1ll11II11ll = IIlI1lI11l1ll11II11ll + I111IIlII1I1llII1I1Il;
				end
				return IIlI1lI11l1ll11II11ll;
			end
			I1Il1IIl1I1l1I1IlIl1I = {  };
			function I1Il1IIl1I1l1I1IlIl1I.IIll1111IllIIIllII111l (lI1lI11Ill1IllI1Il11, lII1lIIl1I1I1ll111)
				lI1lI11Ill1IllI1Il11 = l1III11Il1II1I11II1(lI1lI11Ill1IllI1Il11);
				lII1lIIl1I1I1ll111 = l1III11Il1II1I11II1(lII1lIIl1I1I1ll111);
				local II11lI11lllI1IllIl1Il = 0;
				local I1l1l11I1IIII11IlIII1 = 1;
				for IIllIIIllIIIlI1lI1lI1l = 0, 31 do
					local I1l1I11lI11llIIlIIIll = lI1lI11Ill1IllI1Il11 % 2;
					local lII1III1IllIIl1lIII11 = lII1lIIl1I1I1ll111 % 2;
					if I1l1I11lI11llIIlIIIll == 1 and lII1III1IllIIl1lIII11 == 1 then
						II11lI11lllI1IllIl1Il = II11lI11lllI1IllIl1Il + I1l1l11I1IIII11IlIII1;
					end
					lI1lI11Ill1IllI1Il11 = lI1lI11Ill1IllI1Il11 - I1l1I11lI11llIIlIIIll / 2;
					lII1lIIl1I1I1ll111 = lII1lIIl1I1I1ll111 - lII1III1IllIIl1lIII11 / 2;
					I1l1l11I1IIII11IlIII1 = I1l1l11I1IIII11IlIII1 * 2;
				end
				return II11lI11lllI1IllIl1Il;
			end
			function I1Il1IIl1I1l1I1IlIl1I.lIl1llII1ll1l1I11llII1 (II1lllI11IIIIIll1, II11IlI1Il1ll1llIl1I)
				II1lllI11IIIIIll1 = l1III11Il1II1I11II1(II1lllI11IIIIIll1);
				II11IlI1Il1ll1llIl1I = l1III11Il1II1I11II1(II11IlI1Il1ll1llIl1I);
				local II111111l1llIIIIl1 = 0;
				local IIl1llI1l1I1l1I1llllll = 1;
				for l1ll1llIlIl1llI1lI1I = 0, 31 do
					local lIll111l1lIll1IlllI1 = II1lllI11IIIIIll1 % 2;
					local l11lI1I11IlI1I111l = II11IlI1Il1ll1llIl1I % 2;
					if lIll111l1lIll1IlllI1 == 1 or l11lI1I11IlI1I111l == 1 then
						II111111l1llIIIIl1 = II111111l1llIIIIl1 + IIl1llI1l1I1l1I1llllll;
					end
					II1lllI11IIIIIll1 = II1lllI11IIIIIll1 - lIll111l1lIll1IlllI1 / 2;
					II11IlI1Il1ll1llIl1I = II11IlI1Il1ll1llIl1I - l11lI1I11IlI1I111l / 2;
					IIl1llI1l1I1l1I1llllll = IIl1llI1l1I1l1I1llllll * 2;
				end
				return II111111l1llIIIIl1;
			end
			function I1Il1IIl1I1l1I1IlIl1I.lI111lIII1II1I1I111I1 (II1Il1Il1lll1lI1l1I1l, l1Ill1Il111IlIl1Il1I)
				local lIIllIl1lIIlI1II1lI = 809;
				lIIllIl1lIIlI1II1lI = 809;
				if 1 == 0 then
					local lIlI1III1IlI1I1lIII111;
				end
				do
					lIIllIl1lIIlI1II1lI = lIIllIl1lIIlI1II1lI;
				end
				local IIIllIIlI11l1I111IIl1 = 522;
				IIIllIIlI11l1I111IIl1 = 522;
				if 1 == 0 then
					local IIl1I1l1I1lIl111llI1I;
				end
				do
					IIIllIIlI11l1I111IIl1 = IIIllIIlI11l1I111IIl1;
				end
				II1Il1Il1lll1lI1l1I1l = l1III11Il1II1I11II1(II1Il1Il1lll1lI1l1I1l);
				l1Ill1Il111IlIl1Il1I = l1III11Il1II1I11II1(l1Ill1Il111IlIl1Il1I);
				local III1l1Il1l1111I11l1II = 0;
				local III1I11I1I11l111Illl1 = 1;
				for l1lIllIIlll11111I1lI1 = 0, 31 do
					local l1lI1IllIlllll11llIll = II1Il1Il1lll1lI1l1I1l % 2;
					local I1I1llIllII11Il11II1I = l1Ill1Il111IlIl1Il1I % 2;
					if l1lI1IllIlllll11llIll + I1I1llIllII11Il11II1I == 1 then
						III1l1Il1l1111I11l1II = III1l1Il1l1111I11l1II + III1I11I1I11l111Illl1;
					end
					II1Il1Il1lll1lI1l1I1l = II1Il1Il1lll1lI1l1I1l - l1lI1IllIlllll11llIll / 2;
					l1Ill1Il111IlIl1Il1I = l1Ill1Il111IlIl1Il1I - I1I1llIllII11Il11II1I / 2;
					III1I11I1I11l111Illl1 = III1I11I1I11l111Illl1 * 2;
				end
				return III1l1Il1l1111I11l1II;
			end
			function I1Il1IIl1I1l1I1IlIl1I.IIIIl1I11lIIIII1Il1l (lIIIlI1I11l1Il1Il)
				return I111IIlII1I1llII1I1Il - 1 - l1III11Il1II1I11II1(lIIIlI1I11l1Il1Il);
			end
			function I1Il1IIl1I1l1I1IlIl1I.IIlllI111lIIIll11IlII (lIllllI1l1lI1l1Illl1ll, l1ll111II1llI1l1l11)
				local II1Il1llIl1ll1IIlII1 = 671;
				II1Il1llIl1ll1IIlII1 = 671;
				if 1 == 0 then
					local IIllIIl1IlI1lI1II1II1;
				end
				do
					II1Il1llIl1ll1IIlII1 = II1Il1llIl1ll1IIlII1;
				end
				local IIl11l1lllI11II1lll11 = 720;
				IIl11l1lllI11II1lll11 = 720;
				if 1 == 0 then
					local l1IIlIIl1Il1I1l111I;
				end
				do
					IIl11l1lllI11II1lll11 = IIl11l1lllI11II1lll11;
				end
				l1ll111II1llI1l1l11 = l1ll111II1llI1l1l11 % 32;
				return l1III11Il1II1I11II1(lIllllI1l1lI1l1Illl1ll) * 2 ^ l1ll111II1llI1l1l11 % I111IIlII1I1llII1I1Il;
			end
			function I1Il1IIl1I1l1I1IlIl1I.l1IlIIlll1l11Illl1l1I (lIIIlIIIII1llIll11l11, l111lll1IlIl1IIlIl11)
				l111lll1IlIl1IIlIl11 = l111lll1IlIl1IIlIl11 % 32;
				return lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(9)][IIllIlIIII1lIlI1IlI1Il(8)](l1III11Il1II1I11II1(lIIIlIIIII1llIll11l11) / 2 ^ l111lll1IlIl1IIlIl11);
			end
		end
		local function IIlIIIll1I1I1IlllIIIl (IIIl1IlII1Il1I1lIll1, l1I1I111lIIIIllI11lIl)
			return { IIIl1IlII1Il1I1lIll1, l1I1I111lIIIIllI11lIl };
		end
		local function IIllI1IIl1IlllIlIIl1 (IIIllllI1l11IIlIIl1l1)
			return { 0, IIIllllI1l11IIlIIl1l1 % I111IIlII1I1llII1I1Il };
		end
		local function l11lI1llll1IIIllIllI1 (IIl11llIl11lIIl1I11II)
			return IIl11llIl11lIIl1I11II[2];
		end
		local function lIlll11llII11l11I111I1 (lIlIIlIIll1Illl1Il1I1l, IIl1II1lIII111l1llII1)
			local lIll1I1Ill111IIlIlI1l = 979;
			lIll1I1Ill111IIlIlI1l = 979;
			if 1 == 0 then
				local l1I111I111lIllllI1lII;
			end
			do
				lIll1I1Ill111IIlIlI1l = lIll1I1Ill111IIlIlI1l;
			end
			local l11lll1lI1IIIllIll1II = 772;
			l11lll1lI1IIIllIll1II = 772;
			if 1 == 0 then
				local lII1lllIIIIIl1llII1l1;
			end
			do
				l11lll1lI1IIIllIll1II = l11lll1lI1IIIllIll1II;
			end
			local IIlIIlII1Ill1IIl11IIII = lIlIIlIIll1Illl1Il1I1l[2] + IIl1II1lIII111l1llII1[2];
			local II11I1I1I11l1ll1Il1l1 = 0;
			if IIlIIlII1Ill1IIl11IIII >= I111IIlII1I1llII1I1Il then
				IIlIIlII1Ill1IIl11IIII = IIlIIlII1Ill1IIl11IIII - I111IIlII1I1llII1I1Il;
				II11I1I1I11l1ll1Il1l1 = 1;
			end
			local lIIlI11IIllI1I1l1Il1 = lIlIIlIIll1Illl1Il1I1l[1] + IIl1II1lIII111l1llII1[1] + II11I1I1I11l1ll1Il1l1 % I111IIlII1I1llII1I1Il;
			return { lIIlI11IIllI1I1l1Il1, IIlIIlII1Ill1IIl11IIII };
		end
		local function IIl1l1lIIllll1Il11l1 (IIIll1II1lll11lIlIII1, I1I1IllIIl1l11I11I1ll)
			return IIIll1II1lll11lIlIII1[1] % I1I1IllIIl1l11I11I1ll * I111IIlII1I1llII1I1Il % I1I1IllIIl1l11I11I1ll + IIIll1II1lll11lIlIII1[2] % I1I1IllIIl1l11I11I1ll % I1I1IllIIl1l11I11I1ll;
		end
		local function IIlIIlIl111Il11lllIIl (lIIlIIl1ll1lI1IllIl1l)
			return lIIlIIl1ll1lI1IllIl1l[1] % 255 * 1 + lIIlIIl1ll1lI1IllIl1l[2] % 255 % 255;
		end
		local function lI1IllI11Ill11IllII1 (I1l1Illll1IIlIlIlI1I, IIll1I11l1IlII1111IlI)
			return { I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(10)](I1l1Illll1IIlIlIlI1I[1], IIll1I11l1IlII1111IlI[1]), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(10)](I1l1Illll1IIlIlIlI1I[2], IIll1I11l1IlII1111IlI[2]) };
		end
		local function lIl1ll1llI11lII1II1l1I (l11I11IlI1Ill1II11l1I, lIllllIll1l1I1I1II11)
			return { I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(11)](l11I11IlI1Ill1II11l1I[1], lIllllIll1l1I1I1II11[1]), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(11)](l11I11IlI1Ill1II11l1I[2], lIllllIll1l1I1I1II11[2]) };
		end
		local function I1III1lIIl11111llIllI (l1I1llIl1llIlI1Il11I1, lI1I1lIl1lIlIl1l1I1II)
			return { I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(12)](l1I1llIl1llIlI1Il11I1[1], lI1I1lIl1lIlIl1l1I1II[1]), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(12)](l1I1llIl1llIlI1Il11I1[2], lI1I1lIl1lIlIl1l1I1II[2]) };
		end
		local function IIII1ll1lllI1IIlIlI (IIIII11II11ll1IIl1)
			local lIlIll1I1I111l1IIlIl1l = 822;
			lIlIll1I1I111l1IIlIl1l = 822;
			if 1 == 0 then
				local l1I11l1Il11IIII111IIl;
			end
			do
				lIlIll1I1I111l1IIlIl1l = lIlIll1I1I111l1IIlIl1l;
			end
			return { I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(13)](IIIII11II11ll1IIl1[1]), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(13)](IIIII11II11ll1IIl1[2]) };
		end
		local function lIIII1llIlllllI1111l (lII1I1l1IIlIl1lI1lIl, lIlIIIIlIlll11lI1I11)
			lIlIIIIlIlll11lI1I11 = lIlIIIIlIlll11lI1I11 % 64;
			if lIlIIIIlIlll11lI1I11 == 0 then
				return { lII1I1l1IIlIl1lI1lIl[1], lII1I1l1IIlIl1lI1lIl[2] };
			end
			if lIlIIIIlIlll11lI1I11 >= 32 then
				local l1111IIIIll1llIIl1I1 = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(14)](lII1I1l1IIlIl1lI1lIl[2], lIlIIIIlIlll11lI1I11 - 32);
				return { l1111IIIIll1llIIl1I1, 0 };
			end
			local l1ll1IlIllIIIllll1I1 = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(12)](I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(14)](lII1I1l1IIlIl1lI1lIl[1], lIlIIIIlIlll11lI1I11), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(15)](lII1I1l1IIlIl1lI1lIl[2], 32 - lIlIIIIlIlll11lI1I11));
			local I111IIIIII11IlIIll1lI = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(14)](lII1I1l1IIlIl1lI1lIl[2], lIlIIIIlIlll11lI1I11);
			return { l1ll1IlIllIIIllll1I1, I111IIIIII11IlIIll1lI };
		end
		local function IIlI11lIlI1l1Il111lIlI (l1l1lIIlIl1lIll1lllIl, IIlI11llIllIlIIIlll1l1)
			IIlI11llIllIlIIIlll1l1 = IIlI11llIllIlIIIlll1l1 % 64;
			if IIlI11llIllIlIIIlll1l1 == 0 then
				return { l1l1lIIlIl1lIll1lllIl[1], l1l1lIIlIl1lIll1lllIl[2] };
			end
			if IIlI11llIllIlIIIlll1l1 >= 32 then
				local IIlIII1lllIllI111Illl1 = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(15)](l1l1lIIlIl1lIll1lllIl[1], IIlI11llIllIlIIIlll1l1 - 32);
				return { 0, IIlIII1lllIllI111Illl1 };
			end
			local I1I1Il1Il1I1I1lIIlI1 = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(15)](l1l1lIIlIl1lIll1lllIl[1], IIlI11llIllIlIIIlll1l1);
			local lIllIlIIII11IllIIlI111 = I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(12)](I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(15)](l1l1lIIlIl1lIll1lllIl[2], IIlI11llIllIlIIIlll1l1), I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(14)](l1l1lIIlIl1lIll1lllIl[1], 32 - IIlI11llIllIlIIIlll1l1));
			return { I1I1Il1Il1I1I1lIIlI1, lIllIlIIII11IllIIlI111 };
		end
		local function lIIII1Il111llIIlI1 (IIIIIl1l1I11111lIl1l1, II1IIlII11I1lIIllIllI)
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(10)](IIIIIl1l1I11111lIl1l1, II1IIlII11I1lIIllIllI);
		end
		local function lIIl1IIIIIl1II11lI1I (lI1I1lI1l1II11I1IlI1, IIlIll11l1llIllII111I)
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(11)](lI1I1lI1l1II11I1IlI1, IIlIll11l1llIllII111I);
		end
		local function l1IIllllII1Il11IllIl1 (lII1I1I1II1I1I1l1II11, II11l1I111ll1Il1I1llI)
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(12)](lII1I1I1II1I1I1l1II11, II11l1I111ll1Il1I1llI);
		end
		local function lIIlI1l11llIIll1IIlI1 (I1l1111l111Ill1ll1I1l)
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(13)](I1l1111l111Ill1ll1I1l);
		end
		local function l1Illl1lllII11l1IIl11 (I11111111Il11l11Il1II, IIlIll11II1l1III1lIll1)
			local II1lIIIllIlllIIll11l1 = 620;
			II1lIIIllIlllIIll11l1 = 620;
			if 1 == 0 then
				local IIIIlII1lIIlll11lI1l1;
			end
			do
				II1lIIIllIlllIIll11l1 = II1lIIIllIlllIIll11l1;
			end
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(14)](I11111111Il11l11Il1II, IIlIll11II1l1III1lIll1);
		end
		local function lIlllI11I1Il1l1111III1 (I11IlI111111IllI1l1l, II1IIIllIlIIIl1II11ll)
			return I1Il1IIl1I1l1I1IlIl1I[IIllIlIIII1lIlI1IlI1Il(15)](I11IlI111111IllI1l1l, II1IIIllIlIIIl1II11ll);
		end
		local lIll1lI11l1II1llIl1IIl = { 175, 51, 99, 120 };
		local lIlll1Il11lI1IlI11111l = IIllI1IIl1IlllIlIIl1(0);
		for lIIlIIIl1l111II111l1l = 1, # lIll1lI11l1II1llIl1IIl do
			local I1ll11llI11I11IIllI = lIll1lI11l1II1llIl1IIl[lIIlIIIl1l111II111l1l];
			local I1111ll1l1l1IllI11l1I = IIllI1IIl1IlllIlIIl1(I1ll11llI11I11IIllI);
			lIlll1Il11lI1IlI11111l = lI1IllI11Ill11IllII1(lIlll11llII11l11I111I1(lIlll1Il11lI1IlI11111l, I1111ll1l1l1IllI11l1I), lIl1ll1llI11lII1II1l1I(lIIII1llIlllllI1111l(I1111ll1l1l1IllI11l1I, lIIlIIIl1l111II111l1l - 1 % 3), IIllI1IIl1IlllIlIIl1(0xff)));
			lIlll1Il11lI1IlI11111l = lIl1ll1llI11lII1II1l1I(lIlll1Il11lI1IlI11111l, IIllI1IIl1IlllIlIIl1(0xff));
		end
		lIlll1Il11lI1IlI11111l = IIlIIlIl111Il11lllIIl(lIlll11llII11l11I111I1(lIlll1Il11lI1IlI11111l, IIllI1IIl1IlllIlIIl1(55 + 5)));
		local I1Il1IlI1lI11III1IlI = { 209, 198, 220, 227, 203, 208, 233, 38, 13, 10, 10, 9, 7, 60, 59, 63, 94, 67, 66, 119, 70, 124, 97, 87, 95, 140, 175, 144, 128, 142, 181, 182, 178, 172, 177, 201, 212, 244, 210, 229 };
		local IIII1ll1I1I1I1lII = 113 + 77 + lIlll1Il11lI1IlI11111l % 255 + 1;
		local l1IIllIlI1I1I1l11llII = {  };
		for I11lllll11II1llllI1Il = 1, # I1Il1IlI1lI11III1IlI do
			local l1l1111IIIll1111l11l1 = IIII1ll1I1I1I1lII + I11lllll11II1llllI1Il - 1 * 7 % 255;
			l1IIllIlI1I1I1l11llII[I11lllll11II1llllI1Il] = lIIII1Il111llIIlI1(I1Il1IlI1lI11III1IlI[I11lllll11II1llllI1Il], l1l1111IIIll1111l11l1);
		end
		local lIl1llI11l1II1ll11II1l = l1IIllIlI1I1I1l11llII[5 - 4];
		local I1II111IlI1l11I1llIll = l1IIllIlI1I1I1l11llII[10 - 8];
		local I111I1I1llllI1llI11Il = l1IIllIlI1I1I1l11llII[12 - 9];
		local lI1I11I11IlllI11l111l = l1IIllIlI1I1I1l11llII[9 - 5];
		local IIll1Il1l1l111Illl1l1I = l1IIllIlI1I1I1l11llII[7 - 2];
		local l1lIlII111l1ll1I11lII = l1IIllIlI1I1I1l11llII[13 - 7];
		local IIlIllllI11l1IllII1l1I = l1IIllIlI1I1I1l11llII[8 - 1];
		local l11IIl11l111l11IlIl1 = l1IIllIlI1I1I1l11llII[12 - 4];
		local II1l1ll1IlI1I1llllI1I = l1IIllIlI1I1I1l11llII[18 - 9];
		local I1lII11lIl1IIlIllI1I1 = l1IIllIlI1I1I1l11llII[15 - 5];
		local l1I11l11llI1l11llI11 = l1IIllIlI1I1I1l11llII[16 - 5];
		local IIlI11lIIl1I1I1l111lI1 = l1IIllIlI1I1I1l11llII[14 - 2];
		local lIlllllI11l1lI11llIl11 = l1IIllIlI1I1I1l11llII[21 - 8];
		local I11IlllI11l1ll1IIII1 = l1IIllIlI1I1I1l11llII[16 - 2];
		local I1l1Illll1I1IIIlllll1 = l1IIllIlI1I1I1l11llII[17 - 2];
		local lIll1IIllIIll1IlIll1ll = l1IIllIlI1I1I1l11llII[25 - 9];
		local lII1I1lIIllI1ll11IlI = l1IIllIlI1I1I1l11llII[21 - 4];
		local lIIlI1llll1lllI1I1 = l1IIllIlI1I1I1l11llII[21 - 3];
		local lIlI1II1lIl1llllI111I = l1IIllIlI1I1I1l11llII[22 - 3];
		local l1II1lIl1IIII1l1IlIII = l1IIllIlI1I1I1l11llII[28 - 8];
		local l1IlI1IlIlI1l1l1111I1 = l1IIllIlI1I1I1l11llII[27 - 6];
		local lI1l1lIlIII1IlII111I1 = l1IIllIlI1I1I1l11llII[29 - 7];
		local IIII1IlIl1ll11l1Il1ll = l1IIllIlI1I1I1l11llII[29 - 6];
		local II11IlIIlI11lIllllII = l1IIllIlI1I1I1l11llII[28 - 4];
		local lIIllI1l111llII1l11ll = l1IIllIlI1I1I1l11llII[27 - 2];
		local lIlIIl1111Il1II1I1I11I = l1IIllIlI1I1I1l11llII[30 - 4];
		local I1I1Ill1Il11I1l11lI1l = l1IIllIlI1I1I1l11llII[30 - 3];
		local IIlIllI1l1lII1l1llIII = l1IIllIlI1I1I1l11llII[32 - 4];
		local II11IIlIll11I1lIII11l = l1IIllIlI1I1I1l11llII[38 - 9];
		local lI11l1lI1Il11Il11Ill = l1IIllIlI1I1I1l11llII[37 - 7];
		local I11lI11I1lIlllIIIlI11 = l1IIllIlI1I1I1l11llII[34 - 3];
		local I1I111IIIIIlll1llIl11 = l1IIllIlI1I1I1l11llII[38 - 6];
		local lIlI11l11IllIl1IIlIl11 = l1IIllIlI1I1I1l11llII[39 - 6];
		local IIll1lIIIl1l1l11l1l1I = l1IIllIlI1I1I1l11llII[43 - 9];
		local IIll1lIl1I11Illl1l11II = l1IIllIlI1I1I1l11llII[36 - 1];
		local l1ll1111II1I11I1IlIl = l1IIllIlI1I1I1l11llII[40 - 4];
		local II11lIll1IlI1IIl1I1I = l1IIllIlI1I1I1l11llII[42 - 5];
		local lIlIlllII1IIllIII1Il1l = l1IIllIlI1I1I1l11llII[42 - 4];
		local I1lIl1II11lIlI1I111ll = l1IIllIlI1I1I1l11llII[42 - 3];
		local I1lII1l11llI11I1IlIlI = l1IIllIlI1I1I1l11llII[42 - 2];
		local lI1I1I1I1I1l1IlllI1II = { 47, 232, 236, 35 };
		local lIlll1I1II111lI1Il1I1 = lIIII1Il111llIIlI1(108, 135) + lIlll1Il11lI1IlI11111l % 255 + 1;
		local I1I1IlII11llI1lIlll1l = {  };
		for l1III1111I1Ill11IlI1l = 1, # lI1I1I1I1I1l1IlllI1II do
			local lIll1l1ll1I111I1l11III = lIlll1I1II111lI1Il1I1 + l1III1111I1Ill11IlI1l - 1 * 13 % 255;
			I1I1IlII11llI1lIlll1l[l1III1111I1Ill11IlI1l] = lIIII1Il111llIIlI1(lI1I1I1I1I1l1IlllI1II[l1III1111I1Ill11IlI1l], lIll1l1ll1I111I1l11III);
		end
		local lIIlII1Ill1lIIl1I1l11 = # I1I1IlII11llI1lIlll1l;
		local III11lII1Ill11I11l11 = { { 4, IIllIlIIII1lIlI1IlI1Il(16) .. IIllIlIIII1lIlI1IlI1Il(17) }, { 4, IIllIlIIII1lIlI1IlI1Il(18) .. IIllIlIIII1lIlI1IlI1Il(19) .. IIllIlIIII1lIlI1IlI1Il(20) }, { 4, IIllIlIIII1lIlI1IlI1Il(16) .. IIllIlIIII1lIlI1IlI1Il(21) .. IIllIlIIII1lIlI1IlI1Il(22) }, { 0, IIllIlIIII1lIlI1IlI1Il(23) }, { 3, IIllIlIIII1lIlI1IlI1Il(24) } };
		local lIIlII11I1II111I11I = { 122, 135, 180, 50, 122, 242, 232, 140, 93 };
		local I111llIl11I1l1ll11lIl = {  };
		local I1I11lIl1llI11l1I111l = {  };
		local lI1l11IIIII1IIl11I1lI = {  };
		local I1lllIIl1I11Il1l1IIIl = lIIII1Il111llIIlI1(96, 160) + lIlll1Il11lI1IlI11111l % 255 + 1;
		for IIlll1ll1IIlllIIlIIl1 = 1, # lIIlII11I1II111I11I do
			local IIlIl11IIlI1II1l1l1ll1 = I1lllIIl1I11Il1l1IIIl + IIlll1ll1IIlllIIlIIl1 - 1 * 11 % 255;
			I111llIl11I1l1ll11lIl[IIlll1ll1IIlllIIlIIl1] = lIIII1Il111llIIlI1(lIIlII11I1II111I11I[IIlll1ll1IIlllIIlIIl1], IIlIl11IIlI1II1l1l1ll1);
		end
		local lI1lIl11lIIlIIIIl1III = # I111llIl11I1l1ll11lIl;
		local II11lIl1lIlIl1lI111II = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(25)];
		local function I11I1I1lIII1II1I1IlI1 (lI1l1Ill1I1lll111IIl)
			if lI1l11IIIII1IIl11I1lI[lI1l1Ill1I1lll111IIl] then
				return I1I11lIl1llI11l1I111l[lI1l1Ill1I1lll111IIl];
			end
			lI1l11IIIII1IIl11I1lI[lI1l1Ill1I1lll111IIl] = true;
			local I1l1III111Il11II1l11 = III11lII1Ill11I11l11[lI1l1Ill1I1lll111IIl];
			if not I1l1III111Il11II1l11 then
				return nil;
			end
			local lIlll1l1lI11l1Illlllll = I1l1III111Il11II1l11[1];
			local lIll1I1lIl1IIIllIIIIl1 = I1l1III111Il11II1l11[2];
			local lIII11I11I11IllI11I1I = {  };
			for lII11l1IllI1lllIIIlIl = 1, # lIll1I1lIl1IIIllIIIIl1 do
				local lIlIllI1lllI11ll1lll1l = lII11l1IllI1lllIIIlIl - 1 % lI1lIl11lIIlIIIIl1III + 1;
				local l11Il1lI11Ill11l1IIII = II11lIl1lIlIl1lI111II(lIll1I1lIl1IIIllIIIIl1, lII11l1IllI1lllIIIlIl) - I111llIl11I1l1ll11lIl[lIlIllI1lllI11ll1lll1l];
				if l11Il1lI11Ill11l1IIII < 0 then
					l11Il1lI11Ill11l1IIII = l11Il1lI11Ill11l1IIII + 256;
				end
				lIII11I11I11IllI11I1I[lII11l1IllI1lllIIIlIl] = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](l11Il1lI11Ill11l1IIII);
			end
			local II111lIlll1I1II1Il11l = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(2)][IIllIlIIII1lIlI1IlI1Il(7)](lIII11I11I11IllI11I1I);
			local l11IIlll111llIIl1llI;
			if lIlll1l1lI11l1Illlllll == 0 then
				l11IIlll111llIIl1llI = nil;
			elseif lIlll1l1lI11l1Illlllll == 1 then
				l11IIlll111llIIl1llI = false;
			elseif lIlll1l1lI11l1Illlllll == 2 then
				l11IIlll111llIIl1llI = true;
			elseif lIlll1l1lI11l1Illlllll == 3 then
				l11IIlll111llIIl1llI = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(26)](II111lIlll1I1II1Il11l);
			else
				l11IIlll111llIIl1llI = II111lIlll1I1II1Il11l;
			end
			I1I11lIl1llI11l1I111l[lI1l1Ill1I1lll111IIl] = l11IIlll111llIIl1llI;
			return l11IIlll111llIIl1llI;
		end
		local l1Ill11lIlIll1ll1lIlI = { II1II111l11l11, I1111l1IlI111lIlI1lI1 };
		local IIlI111IIIIl1llllI1lI1 = {  };
		local I1Illl1111I11lllIlllI = 0;
		local IIlll1Il1I1I11l1IIlI1;
		local lIlll1IIlI1Illl1l1Illl = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(5)];
		if lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(6)](lIlll1IIlI1Illl1l1Illl) == IIllIlIIII1lIlI1IlI1Il(1) then
			IIlll1Il1I1I11l1IIlI1 = lIlll1IIlI1Illl1l1Illl(1);
		end
		if lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(6)](IIlll1Il1I1I11l1IIlI1) ~= IIllIlIIII1lIlI1IlI1Il(2) then
			IIlll1Il1I1I11l1IIlI1 = _G;
		end
		local lI11I1lI11lI1IIllIll1 = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(2)][IIllIlIIII1lIlI1IlI1Il(27)];
		local l11Ill1lI1lIllIIl1Ill = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(2)][IIllIlIIII1lIlI1IlI1Il(28)];
		local IIIl1I1l1lIllIlIIl1l = { lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](252, 46, 63, 80, 131, 114, 131, 148, 70, 182, 199, 216, 31, 250, 11, 28, 219, 62, 79, 96, 133, 130, 147, 164, 184, 198, 215, 232, 255, 10, 27, 44, 59, 78, 95, 112, 85, 146, 163, 180, 20, 214, 231, 248, 219, 26, 43, 60, 189, 94, 111, 128, 114, 162, 179, 196, 54, 230, 247, 8) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](201, 42, 59, 76, 169, 110, 127, 144, 85, 178, 195, 212, 242, 246, 7, 24, 46, 58, 75, 92, 107, 126, 143, 160, 97, 194, 211, 228, 36, 6, 23, 40, 235, 74, 91, 108, 137, 142, 159, 176, 34, 210, 227, 244, 230, 22, 39, 56, 153, 90, 107, 124, 121, 158, 175, 192, 37, 226, 243, 4) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](2, 38, 55, 72, 93, 106, 123, 140, 155, 174, 191, 208, 49, 242, 3, 20, 246, 54, 71, 88, 187, 122, 139, 156, 76, 190, 207, 224, 16, 2, 19, 36, 214, 70, 87, 104, 172, 138, 155, 172, 73, 206, 223, 240, 245, 18, 35, 52, 84, 86, 103, 120, 143, 154, 171, 188, 203, 222, 239, 0) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](197, 34, 51, 68, 131, 102, 119, 136, 75, 170, 187, 204, 25, 238, 255, 16, 193, 50, 67, 84, 134, 118, 135, 152, 95, 186, 203, 220, 29, 254, 15, 32, 197, 66, 83, 100, 81, 134, 151, 168, 190, 202, 219, 236, 248, 14, 31, 48, 149, 82, 99, 116, 80, 150, 167, 184, 27, 218, 235, 252) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](232, 30, 47, 64, 180, 98, 115, 132, 118, 166, 183, 200, 43, 234, 251, 12, 236, 46, 63, 80, 149, 114, 131, 148, 161, 182, 199, 216, 234, 250, 11, 28, 43, 62, 79, 96, 161, 130, 147, 164, 97, 198, 215, 232, 43, 10, 27, 44, 220, 78, 95, 112, 101, 146, 163, 180, 38, 214, 231, 248) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](223, 26, 43, 60, 187, 94, 111, 128, 103, 162, 179, 196, 213, 230, 247, 8, 22, 42, 59, 76, 91, 110, 127, 144, 117, 178, 195, 212, 63, 246, 7, 24, 251, 58, 75, 92, 140, 126, 143, 160, 90, 194, 211, 228, 22, 6, 23, 40, 220, 74, 91, 108, 141, 142, 159, 176, 53, 210, 227, 244) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](15, 22, 39, 56, 79, 90, 107, 124, 139, 158, 175, 192), lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](28, 226, 243, 4, 238, 38, 55, 72, 139, 106, 123, 140, 100, 174, 191, 208, 2, 242, 3, 20, 198, 54, 71, 88, 159, 122, 139, 156, 81, 190, 207, 224, 5, 2, 19, 36, 53, 70, 87, 104, 120, 138, 155, 172, 187, 206, 223, 240, 209, 18, 35, 52, 148, 86, 103, 120, 91, 154, 171, 188) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](44, 222, 239, 0, 251, 34, 51, 68, 182, 102, 119, 136, 102, 170, 187, 204, 41, 238, 255, 16, 213, 50, 67, 84, 101, 118, 135, 152, 172, 186, 203, 220, 235, 254, 15, 32, 235, 66, 83, 100, 176, 134, 151, 168, 107, 202, 219, 236, 4, 14, 31, 48, 162, 82, 99, 116, 102, 150, 167, 184) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](63, 218, 235, 252, 250, 30, 47, 64, 165, 98, 115, 132, 130, 166, 183, 200, 218, 234, 251, 12, 27, 46, 63, 80, 161, 114, 131, 148, 119, 182, 199, 216, 59, 250, 11, 28, 203, 62, 79, 96, 166, 130, 147, 164, 86, 198, 215, 232, 23, 10, 27, 44, 201, 78, 95, 112, 117, 146, 163, 180) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](193, 214, 231, 248, 11, 26, 43, 60, 75, 94, 111, 128, 82, 162, 179, 196, 5, 230, 247, 8, 203, 42, 59, 76, 163, 110, 127, 144, 66, 178, 195, 212, 6, 246, 7, 24, 205, 58, 75, 92, 152, 126, 143, 160, 69, 194, 211, 228, 251, 6, 23, 40, 10, 74, 91, 108, 123, 142, 159, 176) .. lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(3)](9, 210, 227, 244, 215, 22, 39, 56, 155, 90, 107, 124, 108, 158, 175, 192, 49, 226, 243, 4, 246, 38, 55, 72, 189, 106, 123, 140, 104, 174, 191, 208, 21, 242, 3, 20, 51, 54, 71, 88, 111, 122, 139, 156, 171, 190, 207, 224) };
		local I1I11I11II1lllI1IlIl = { 1, 2 };
		local l11llIlI1III1Illll1l = {  };
		for lIlI1l11llIII1l1111II = 1, # I1I11I11II1lllI1IlIl do
			l11llIlI1III1Illll1l[lIlI1l11llIII1l1111II] = IIIl1I1l1lIllIlIIl1l[I1I11I11II1lllI1IlIl[lIlI1l11llIII1l1111II]];
		end
		local II11llll1Ill1l1IIIl1 = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(2)][IIllIlIIII1lIlI1IlI1Il(7)](l11llIlI1III1Illll1l);
		local lI11l11I1l1Ill1Illll1 = 80 + 186 + lIlll1Il11lI1IlI11111l % 255 + 1;
		local l1lIIIlI1lllI1lI11III = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(4)][IIllIlIIII1lIlI1IlI1Il(25)];
		local function l11lII1I1llllIIlI1 (IIIl1l1IlIIIll11IlIII)
			local l11IIllIlIl1llII1I1 = l1lIIIlI1lllI1lI11III(II11llll1Ill1l1IIIl1, IIIl1l1IlIIIll11IlIII);
			local IIlII11l11lIl1II1Il1l = lI11l11I1l1Ill1Illll1 + IIIl1l1IlIIIll11IlIII - 1 * 17 % 256;
			return lIIII1Il111llIIlI1(l11IIllIlIl1llII1I1, IIlII11l11lIl1II1Il1l);
		end
		local function l1lI1IlIlIlIllIIIl11I (lIIllII1IIII11ll11Il1)
			local I1II1II1lIllI1IlI1II = l11lII1I1llllIIlI1(lIIllII1IIII11ll11Il1);
			local IIlIllll1IlIlll1Illl = l11lII1I1llllIIlI1(lIIllII1IIII11ll11Il1 + 1);
			local IIlI111IIllI1llI11I = l11lII1I1llllIIlI1(lIIllII1IIII11ll11Il1 + 2);
			local I111I1l1IIIIl1Il11II1 = l11lII1I1llllIIlI1(lIIllII1IIII11ll11Il1 + 3);
			return I1II1II1lIllI1IlI1II + IIlIllll1IlIlll1Illl * 256 + IIlI111IIllI1llI11I * 65536 + I111I1l1IIIIl1Il11II1 * 16777216;
		end
		local function I1lI1111I11IIllllIl1I (lI1II1l1ll11111l1ll1)
			local I1llIlll11l111lllllI = lI1II1l1ll11111l1ll1 - 1 * 12 + 1;
			local lIlllI11IIlll11lI1l1Il = l1lI1IlIlIlIllIIIl11I(I1llIlll11l111lllllI);
			local l11III11I1I1lIIIlIlI = l1lI1IlIlIlIllIIIl11I(I1llIlll11l111lllllI + 4);
			local IIlIIIlll1lllll1111lIl = l1lI1IlIlIlIllIIIl11I(I1llIlll11l111lllllI + 8);
			return lIlllI11IIlll11lI1l1Il, l11III11I1I1lIIIlIlI, IIlIIIlll1lllll1111lIl;
		end
		local I11IIIl11I1l1l1I1l1ll = 1;
		while true do
			local lI11II1l1ll11Illll1lI, lI1II1IIll11lIII1lIII, lIIlI1I11IIl1Il11llll = I1lI1111I11IIllllIl1I(I11IIIl11I1l1l1I1l1ll);
			local lIlI1IIlIIlI1l1I11I11I = 0;
			if lIIlII1Ill1lIIl1I1l11 > 0 then
				local l1II1IIIl11I1l1l1I1 = I11IIIl11I1l1l1I1l1ll + lIlll1Il11lI1IlI11111l - 1 % lIIlII1Ill1lIIl1I1l11 + 1;
				lIlI1IIlIIlI1l1I11I11I = I1I1IlII11llI1lIlll1l[l1II1IIIl11I1l1l1I1];
				lI11II1l1ll11Illll1lI = lIIII1Il111llIIlI1(lI11II1l1ll11Illll1lI, lIlI1IIlIIlI1l1I11I11I);
				lI1II1IIll11lIII1lIII = lIIII1Il111llIIlI1(lI1II1IIll11lIII1lIII, lIlI1IIlIIlI1l1I11I11I);
				lIIlI1I11IIl1Il11llll = lIIII1Il111llIIlI1(lIIlI1I11IIl1Il11llll, lIlI1IIlIIlI1l1I11I11I);
			end
			if lI11II1l1ll11Illll1lI == lIl1llI11l1II1ll11II1l then
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1II111IlI1l11I1llIll then
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = I11I1I1lIII1II1I1IlI1(lI1II1IIll11lIII1lIII);
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I111I1I1llllI1llI11Il then
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = l1Ill11lIlIll1ll1lIlI[lI1II1IIll11lIII1lIII];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lI1I11I11IlllI11l111l then
				l1Ill11lIlIll1ll1lIlI[lI1II1IIll11lIII1lIII] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIll1Il1l1l111Illl1l1I then
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = IIlll1Il1I1I11l1IIlI1[I11I1I1lIII1II1I1IlI1(lI1II1IIll11lIII1lIII)];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l1lIlII111l1ll1I11lII then
				IIlll1Il1I1I11l1IIlI1[I11I1I1lIII1II1I1IlI1(lI1II1IIll11lIII1lIII)] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIlIllllI11l1IllII1l1I then
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = {  };
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l11IIl11l111l11IlIl1 then
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == II1l1ll1IlI1I1llllI1I then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1lII11lIl1IIlIllI1I1 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l1I11l11llI1l11llI11 then
				local II1lI11l111lll1l1Il11 = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				local IIlll1l11lI1I1lllIIlI = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlll1l11lI1I1lllIIlI[II1lI11l111lll1l1Il11];
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIlI11lIIl1I1I1l111lI1 then
				local l1l1l11lIIIllllIII = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				local IIllll1I1IllIIlIIllI1 = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = nil;
				local lI11lIII1II1llIl1III = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 2];
				lI11lIII1II1llIl1III[IIllll1I1IllIIlIIllI1] = l1l1l11lIIIllllIII;
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 2] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 3;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIlllllI11l1lI11llIl11 then
				local l1IIllI11lIl1I1ll1lll = lI1II1IIll11lIII1lIII;
				local II1lIIII1ll1IIlI11Il = lIIlI1I11IIl1Il11llll;
				local lIllll11IIIll1l111llI = I1Illl1111I11lllIlllI - l1IIllI11lIl1I1ll1lll;
				local lIllll1lIl11IlI11Ill1l = IIlI111IIIIl1llllI1lI1[lIllll11IIIll1l111llI];
				if II1lIIII1ll1IIlI11Il == 0 then
					lIllll1lIl11IlI11Ill1l(l11Ill1lI1lIllIIl1Ill(IIlI111IIIIl1llllI1lI1, lIllll11IIIll1l111llI + 1, I1Illl1111I11lllIlllI))
					for lIl111ll1l11IllIlll11 = I1Illl1111I11lllIlllI, lIllll11IIIll1l111llI, - 1 do
						IIlI111IIIIl1llllI1lI1[lIl111ll1l11IllIlll11] = nil;
					end
					I1Illl1111I11lllIlllI = lIllll11IIIll1l111llI - 1;
				else
					local l111IlI1lI1I1Ill1III = lI11I1lI11lI1IIllIll1(lIllll1lIl11IlI11Ill1l(l11Ill1lI1lIllIIl1Ill(IIlI111IIIIl1llllI1lI1, lIllll11IIIll1l111llI + 1, I1Illl1111I11lllIlllI)));
					for l11II11I111llI1ll1I11 = I1Illl1111I11lllIlllI, lIllll11IIIll1l111llI, - 1 do
						IIlI111IIIIl1llllI1lI1[l11II11I111llI1ll1I11] = nil;
					end
					I1Illl1111I11lllIlllI = lIllll11IIIll1l111llI - 1;
					if II1lIIII1ll1IIlI11Il == 1 then
						I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
						IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = l111IlI1lI1I1Ill1III[1];
					else
						for IIlI1IIl1l1Ill1IIl1II = 1, II1lIIII1ll1IIlI11Il do
							I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI + 1;
							IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = l111IlI1lI1I1Ill1III[IIlI1IIl1l1Ill1IIl1II];
						end
					end
				end
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I11IlllI11l1ll1IIII1 then
				local I1IIl11I1111I1ll1ll11 = lI1II1IIll11lIII1lIII;
				if I1IIl11I1111I1ll1ll11 == 0 then
					return;
				elseif I1IIl11I1111I1ll1ll11 == 1 then
					return IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				else
					local lII1IIl1Ill1III11lII = I1Illl1111I11lllIlllI - I1IIl11I1111I1ll1ll11 + 1;
					return l11Ill1lI1lIllIIl1Ill(IIlI111IIIIl1llllI1lI1, lII1IIl1Ill1III11lII, I1Illl1111I11lllIlllI);
				end
			elseif lI11II1l1ll11Illll1lI == I1l1Illll1I1IIIlllll1 then
				I11IIIl11I1l1l1I1l1ll = lI1II1IIll11lIII1lIII;
			elseif lI11II1l1ll11Illll1lI == lIll1IIllIIll1IlIll1ll then
				if not IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] then
					I11IIIl11I1l1l1I1l1ll = lI1II1IIll11lIII1lIII;
				else
					I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
				end
			elseif lI11II1l1ll11Illll1lI == lII1I1lIIllI1ll11IlI then
				if IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] then
					I11IIIl11I1l1l1I1l1ll = lI1II1IIll11lIII1lIII;
				else
					I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
				end
			elseif lI11II1l1ll11Illll1lI == lIIlI1llll1lllI1I1 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] + IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIlI1II1lIl1llllI111I then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] - IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l1II1lIl1IIII1l1IlIII then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] * IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l1IlI1IlIlI1l1l1111I1 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] / IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lI1l1lIlIII1IlII111I1 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(9)][IIllIlIIII1lIlI1IlI1Il(8)](IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] / IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIII1IlIl1ll11l1Il1ll then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] % IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == II11IlIIlI11lIllllII then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] ^ IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIIllI1l111llII1l11ll then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] .. IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIlIIl1111Il1II1I1I11I then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] == IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1I1Ill1Il11I1l11lI1l then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] ~= IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIlIllI1l1lII1l1llIII then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] < IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == II11IIlIll11I1lIII11l then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] <= IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lI11l1lI1Il11Il11Ill then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] > IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I11lI11I1lIlllIIIlI11 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] >= IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1I111IIIIIlll1llIl11 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = lIIl1IIIIIl1II11lI1I(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIlI11l11IllIl1IIlIl11 then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = l1IIllllII1Il11IllIl1(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIll1lIIIl1l1l11l1l1I then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = lIIII1Il111llIIlI1(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == IIll1lIl1I11Illl1l11II then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = l1Illl1lllII11l1IIl11(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == l1ll1111II1I11I1IlIl then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1] = lIlllI11I1Il1l1111III1(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI - 1], IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = nil;
				I1Illl1111I11lllIlllI = I1Illl1111I11lllIlllI - 1;
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == II11lIll1IlI1IIl1I1I then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = - IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == lIlIlllII1IIllIII1Il1l then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = not IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1lIl1II11lIlI1I111ll then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = # IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI];
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			elseif lI11II1l1ll11Illll1lI == I1lII1l11llI11I1IlIlI then
				IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI] = lIIlI1l11llIIll1IIlI1(IIlI111IIIIl1llllI1lI1[I1Illl1111I11lllIlllI]);
				I11IIIl11I1l1l1I1l1ll = I11IIIl11I1l1l1I1l1ll + 1;
			else
				return;
			end
		end
	end
end
lI1I111IIll1IIllII11I[IIllIlIIII1lIlI1IlI1Il(29)](IIlIIll1lI1l111lI11l(2, 6))