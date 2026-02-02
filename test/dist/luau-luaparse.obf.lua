do
	local function II1IIIlIII11II111Il11 (lI1Il1lll1ll111l11Ill)
		error(lI1Il1lll1ll111l11Ill, 0)
	end
	local function lI1l1II1I1IlI1I1IlIll ()
		local lIlI111IIIlIIII1llI1I = _ENV;
		local lI11lIlIIlIl1I1I1lIIl = rawget;
		local IIlIIlI1lIII111Il1111I = nil;
		if lI11lIlIIlIl1I1I1lIIl then
			IIlIIlI1lIII111Il1111I = lI11lIlIIlIl1I1I1lIIl(lIlI111IIIlIIII1llI1I, "type");
		end
		if not IIlIIlI1lIII111Il1111I then
			II1IIIlIII11II111Il11("Integrity check failed")
		end
		if IIlIIlI1lIII111Il1111I(lIlI111IIIlIIII1llI1I) ~= "table" then
			II1IIIlIII11II111Il11("Integrity check failed")
		end
		if IIlIIlI1lIII111Il1111I(lI11lIlIIlIl1I1I1lIIl) == "function" then
			local l11l1II1ll1lI11I1IIIl = lI11lIlIIlIl1I1I1lIIl(lIlI111IIIlIIII1llI1I, "debug");
			if l11l1II1ll1lI11I1IIIl and IIlIIlI1lIII111Il1111I(l11l1II1ll1lI11I1IIIl) == "table" then
				local I1III1lIII1llIl1l111l = l11l1II1ll1lI11I1IIIl.II11l11IlI1III1III111;
				if IIlIIlI1lIII111Il1111I(I1III1lIII1llIl1l111l) == "function" then
					local lIl11IlIl111llII11l11, I1l1l11Il1II11I1IIllI = pcall(I1III1lIII1llIl1l111l);
					if lIl11IlIl111llII11l11 and I1l1l11Il1II11I1IIllI ~= nil then
						II1IIIlIII11II111Il11("Integrity check failed")
					end
				end
			end
		end
		local IIlI11ll1IIl111I1lIl = getmetatable;
		if IIlIIlI1lIII111Il1111I(IIlI11ll1IIl111I1lIl) == "function" then
			local III11l1IlIIllIlI1I1I1 = IIlI11ll1IIl111I1lIl(lIlI111IIIlIIII1llI1I);
			if III11l1IlIIllIlI1I1I1 ~= nil then
				II1IIIlIII11II111Il11("Integrity check failed")
			end
		end
	end
	lI1l1II1I1IlI1I1IlIll()
	local lIIIlI1Il1lII111II1 = false;
	if lIIIlI1Il1lII111II1 then
		local l1111lI1lIl1111lII1 = setmetatable;
		if typeFn(l1111lI1lIl1111lII1) == "function" then
			local lIl1llII1IlI1IllIIl11I = _ENV;
			local I1II1I1Ill11l11I1II = getmetatable(lIl1llII1IlI1IllIIl11I);
			if I1II1I1Ill11l11I1II == nil then
				I1II1I1Ill11l11I1II = {  };
				l1111lI1lIl1111lII1(lIl1llII1IlI1IllIIl11I, I1II1I1Ill11l11I1II)
			end
			if I1II1I1Ill11l11I1II.I11lIl1l11IllI11lIllI == nil then
				I1II1I1Ill11l11I1II.I11lIl1l11IllI11lIllI = "locked";
			end
			if I1II1I1Ill11l11I1II.l1lllI1Illl1l111llI1l == nil then
				I1II1I1Ill11l11I1II.l1lllI1Illl1l111llI1l = function ()
					error("Runtime integrity violation", 0)
				end;
			end
		end
	end
end
local lI1lIl1Il1I1l1lll1lll = { { 96, 20, 215, 237 }, { 96, 27, 228, 222, 45, 166 }, { 109, 13, 217, 230 }, { 114, 26, 230, 220, 47, 157 } };
local I11I11Il1IIlIIllIlIl = { 253, 172, 118, 123, 204, 50, 152, 130, 25, 244, 37, 111, 83, 115, 103, 51 };
local lII1Il1111I1IlI11III1 = {  };
local function I11llIl11IIl1I1llI (l1I1lII1l1I1l11l1lll1)
	local IIlI1Il1Il11lIl1111II1 = lII1Il1111I1IlI11III1[l1I1lII1l1I1l11l1lll1];
	if IIlI1Il1Il11lIl1111II1 ~= nil then
		return IIlI1Il1Il11lIl1111II1;
	end
	local lIII1I1lIIll11lI1IIlI = lI1lIl1Il1I1l1lll1lll[l1I1lII1l1I1l11l1lll1];
	local IIlII1llII1I1IllII1Il1 = {  };
	local lIlI1l11lIIlIlIlII1ll1 = # I11I11Il1IIlIIllIlIl;
	for l1l1llIIII11IIlIll1I = 1, # lIII1I1lIIll11lI1IIlI do
		local lIIll1ll11I1IlI1lll11 = l1l1llIIII11IIlIll1I - 1;
		lIIll1ll11I1IlI1lll11 = lIIll1ll11I1IlI1lll11 % lIlI1l11lIIlIlIlII1ll1;
		lIIll1ll11I1IlI1lll11 = lIIll1ll11I1IlI1lll11 + 1;
		local l1111lll11IIll1IIll1l = lIII1I1lIIll11lI1IIlI[l1l1llIIII11IIlIll1I] - I11I11Il1IIlIIllIlIl[lIIll1ll11I1IlI1lll11];
		if l1111lll11IIll1IIll1l < 0 then
			l1111lll11IIll1IIll1l = l1111lll11IIll1IIll1l + 256;
		end
		IIlII1llII1I1IllII1Il1[l1l1llIIII11IIlIll1I] = string.l111II1IllllI1Ill1(l1111lll11IIll1IIll1l);
	end
	local l1l1l1lll1II1lI1l11I = table.IIlIl1lIIllI1l11IIlIlI(IIlII1llII1I1IllII1Il1);
	lII1Il1111I1IlI11III1[l1I1lII1l1I1l11l1lll1] = l1l1l1lll1II1lI1l11I;
	return l1l1l1lll1II1lI1l11I;
end
local function lIIl1l1lIlIIll1IlllI1 (I1lI111llIIIIIll11IIl, lIllIl11II1II1ll11IIIl)
	local lIll1I11I1lIll1IlIllll = 661;
	lIll1I11I1lIll1IlIllll = 661;
	if 1 == 0 then
		local lIlIIllIl111111l1l1I1I;
	end
	do
		lIll1I11I1lIll1IlIllll = lIll1I11I1lIll1IlIllll;
	end
	do
		local lI111I1lIIIII11lI111 = 7;
		local lI1lIIIIll1I1I1III1l = 1;
		local I1ll11IIlIlIlI11l11l1 = 40;
		local I1IIII1IIl111lIl1lIlI = 30;
		local I1llII11IlIII1lII11II = 32;
		local IIlII11llIlIllIlll11II = 39;
		local l1IlllIII1IIIllllI11l = 10;
		local I11I1IIIl1II1I1l11l1I = 26;
		local l1lIlI1lllI1l1Il1lll1 = 11;
		local l1I1I1III11l1l111 = 16;
		local l11lI1lll1I1l1llIlIl1 = 4;
		local lIlI11l111I11I11111llI = 31;
		local l11I111llIll1lllI11ll = 27;
		local lIlIl1ll11llII1II1lIl1 = 21;
		local l1l111ll1llllI1I1l1II = 2;
		local IIll1lIl1ll1llI11lIll1 = 35;
		local III111IIlIll1lIIIlll1 = 20;
		local lIl11II11llIlIIlllI = 34;
		local l11I1llII1I1IIIII1 = 23;
		local l11l1III1IlI1IIlIl1 = 14;
		local l1I1IlllI1IlIllI1Il1I = 9;
		local lIlI11ll11lllI1l1IIlll = 5;
		local lI1lllI1Ill1IllIIl1ll = 25;
		local l1l11IlI11I11ll11l1l1 = 36;
		local II1l1l11l11IlI1lIlIl1 = 37;
		local IIl1Il1ll1IIllll1IlI = 19;
		local lIlII1111lI1l111llllII = 24;
		local IIIIIIIIIIIIllllI1I1l = 3;
		local l11lIlI1lI111l1llI1l1 = 17;
		local l1lI11I1l1I1IIllIIlI = 12;
		local lII1ll1ll1llII11l1Il1 = 13;
		local IIlI1llll11lI1II1I111l = 22;
		local lI11l1l1IIIlIllllIlIl = 28;
		local IIlI11llIl1lIIlI1llll = 38;
		local IIII1I1lI1Il1lIIlII1 = 6;
		local l1lI1Il11lI11lll1Il1 = 18;
		local lIlIl11III1I1I1Illlll1 = 15;
		local l1IIl1I1I1111111l1 = 8;
		local lIllIIIIIII1lIlllIlI = 29;
		local IIIIl1IlIIlI1IllIII1 = 33;
		local IIlll1Il11II1I1111lI1I = { { { 198, 239, 238 }, { 198, 236, 238 }, { 204, 238, 238 }, { 240, 237, 238 }, { 228, 238, 238 }, { 244, 238, 238 }, { 239, 239, 238 }, { 198, 237, 238 }, { 241, 238, 238 }, { 244, 238, 238 }, { 239, 236, 238 }, { 198, 239, 238 }, { 198, 236, 238 }, { 224, 238, 238 }, { 241, 238, 238 }, { 240, 234, 238 }, { 206, 237, 238 }, { 198, 234, 238 }, { 245, 239, 239 }, { 240, 235, 238 }, { 239, 234, 238 }, { 240, 232, 238 }, { 239, 234, 238 }, { 240, 233, 238 }, { 198, 235, 238 }, { 198, 232, 238 }, { 198, 233, 238 }, { 245, 236, 236 }, { 240, 231, 238 }, { 240, 230, 238 }, { 198, 230, 238 }, { 239, 234, 238 }, { 253, 238, 238 }, { 250, 197, 238 }, { 254, 238, 238 }, { 198, 230, 238 }, { 240, 233, 238 }, { 198, 237, 238 }, { 198, 231, 238 }, { 204, 238, 238 }, { 240, 237, 238 }, { 236, 247, 238 }, { 254, 238, 238 }, { 198, 237, 238 }, { 239, 235, 238 }, { 226, 238, 238 }, { 205, 216, 238 }, { 254, 238, 238 }, { 198, 234, 238 }, { 239, 236, 238 } }, { { 234, 238, 238 }, { 251, 239, 238 }, { 236, 217, 238 } }, { { 254, 238, 238 }, { 198, 237, 238 }, { 251, 239, 238 } }, { { 251, 238, 238 } } };
		local IIlIlIlIIl1Il1IlI1l1II = { 1, 51, 54, 57 };
		local l1I1Ill11IIIlIllIII = { 1, 4, 2, 3 };
		local I1I1lllIII1l11lIl1lI1 = {  };
		for lIIIlIl1IlI1IIIllllII = 1, # l1I1Ill11IIIlIllIII do
			local l111llI1ll1l1l1l11Ill = l1I1Ill11IIIlIllIII[lIIIlIl1IlI1IIIllllII];
			local I1lI1IIllIlIl1l1Il111 = IIlll1Il11II1I1111lI1I[l111llI1ll1l1l1l11Ill];
			local II1l1Ill1I1I11111I1I = IIlIlIlIIl1Il1IlI1l1II[l111llI1ll1l1l1l11Ill];
			for I11lll1ll11Il1Illl11 = 1, # I1lI1IIllIlIl1l1Il111 do
				I1I1lllIII1l11lIl1lI1[II1l1Ill1I1I11111I1I + I11lll1ll11Il1Illl11 - 1] = I1lI1IIllIlIl1l1Il111[I11lll1ll11Il1Illl11];
			end
		end
		local lIlll1Il1I1IIlIIII11l = { { 4, { 18, 152, 254 } }, { 4, { 14, 138, 1 } }, { 4, { 28, 138, 248, 37, 209 } }, { 0, {  } }, { 3, { 221, 89 } } };
		local I11Il1lII1Il11l1l1l1I = { 172, 41, 143, 179, 94, 168, 90, 92, 193, 132 };
		local III1l1I1l11IIll1I11Il = {  };
		local IIlIl1Illl111I11lI111 = # I11Il1lII1Il11l1l1l1I;
		for I111IIl1IlII1lIll1lI1 = 1, 5 do
			local l1lI11l1llllIlI1lIlll = lIlll1Il1I1IIlIIII11l[I111IIl1IlII1lIll1lI1];
			local I11ll1IIl111I11l1Il = l1lI11l1llllIlI1lIlll[1];
			local IIIll1III1II11ll111lI = l1lI11l1llllIlI1lIlll[2];
			local lIIll1l1llIlIlllIII1I = {  };
			for lIIl1lI1Il1I1IlllIlI1 = 1, # IIIll1III1II11ll111lI do
				local I1IIII1ll1IlIIIlIlIl = lIIl1lI1Il1I1IlllIlI1 - 1 % IIlIl1Illl111I11lI111 + 1;
				local IIIIIlIII1lIllIIIll1l = IIIll1III1II11ll111lI[lIIl1lI1Il1I1IlllIlI1] - I11Il1lII1Il11l1l1l1I[I1IIII1ll1IlIIIlIlIl];
				if IIIIIlIII1lIllIIIll1l < 0 then
					IIIIIlIII1lIllIIIll1l = IIIIIlIII1lIllIIIll1l + 256;
				end
				lIIll1l1llIlIlllIII1I[lIIl1lI1Il1I1IlllIlI1] = string[I11llIl11IIl1I1llI(1)](IIIIIlIII1lIllIIIll1l);
			end
			local I1lIIIlllII11l1llI1ll = table[I11llIl11IIl1I1llI(2)](lIIll1l1llIlIlllIII1I);
			if I11ll1IIl111I11l1Il == 0 then
				III1l1I1l11IIll1I11Il[I111IIl1IlII1lIll1lI1] = nil;
			elseif I11ll1IIl111I11l1Il == 1 then
				III1l1I1l11IIll1I11Il[I111IIl1IlII1lIll1lI1] = false;
			elseif I11ll1IIl111I11l1Il == 2 then
				III1l1I1l11IIll1I11Il[I111IIl1IlII1lIll1lI1] = true;
			elseif I11ll1IIl111I11l1Il == 3 then
				III1l1I1l11IIll1I11Il[I111IIl1IlII1lIll1lI1] = tonumber(I1lIIIlllII11l1llI1ll);
			else
				III1l1I1l11IIll1I11Il[I111IIl1IlII1lIll1lI1] = I1lIIIlllII11l1llI1ll;
			end
		end
		local l11IIlIIllI11IIlIll1I = 175 + # I1I1lllIII1l11lIl1lI1 + 5 % 255 + 1;
		local I1llIIIl1l1lIll11lIIl = { I1lI111llIIIIIll11IIl, lIllIl11II1II1ll11IIIl };
		local lIlIlIIll11lIlII1111lI = {  };
		local lIlllII1Il1lI11III1I1l = 0;
		local lI1l1llI1Il1IIlIlIl1 = 1;
		local IIIIl1l1l11II1I11I1l1 = _ENV;
		local l1lI1II1l1lll1lIlIlI1 = table[I11llIl11IIl1I1llI(3)];
		local l1Ill1lI1l1Il1IIlI = table[I11llIl11IIl1I1llI(4)];
		while true do
			local l1Il11I1l1Il1l1l111Il = I1I1lllIII1l11lIl1lI1[lI1l1llI1Il1IIlIlIl1];
			local l1lI1II1II1l1I1lIIlll = l1Il11I1l1Il1l1l111Il[1];
			local lIlI11I1IIllIll11Ill1I = l1Il11I1l1Il1l1l111Il[2];
			local l1l1I1I1IllllI1111III = l1Il11I1l1Il1l1l111Il[3];
			if l11IIlIIllI11IIlIll1I ~= 0 then
				l1lI1II1II1l1I1lIIlll = l1lI1II1II1l1I1lIIlll ~ l11IIlIIllI11IIlIll1I;
				lIlI11I1IIllIll11Ill1I = lIlI11I1IIllIll11Ill1I ~ l11IIlIIllI11IIlIll1I;
				l1l1I1I1IllllI1111III = l1l1I1I1IllllI1111III ~ l11IIlIIllI11IIlIll1I;
			end
			if l1lI1II1II1l1I1lIIlll == lI111I1lIIIII11lI111 then
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lI1lIIIIll1I1I1III1l then
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = III1l1I1l11IIll1I11Il[lIlI11I1IIllIll11Ill1I];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == I1ll11IIlIlIlI11l11l1 then
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = I1llIIIl1l1lIll11lIIl[lIlI11I1IIllIll11Ill1I];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == I1IIII1IIl111lIl1lIlI then
				I1llIIIl1l1lIll11lIIl[lIlI11I1IIllIll11Ill1I] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == I1llII11IlIII1lII11II then
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = IIIIl1l1l11II1I11I1l1[III1l1I1l11IIll1I11Il[lIlI11I1IIllIll11Ill1I]];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIlII11llIlIllIlll11II then
				IIIIl1l1l11II1I11I1l1[III1l1I1l11IIll1I11Il[lIlI11I1IIllIll11Ill1I]] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1IlllIII1IIIllllI11l then
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = {  };
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == I11I1IIIl1II1I1l11l1I then
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1lIlI1lllI1l1Il1lll1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l], lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1], lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1I1I1III11l1l111 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l11lI1lll1I1l1llIlIl1 then
				local lI11II111Ill1lII1IIll = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				local II1ll11IlIl1I1llI1I1l = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = II1ll11IlIl1I1llI1I1l[lI11II111Ill1lII1IIll];
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIlI11l111I11I11111llI then
				local lIlI1l1I11l11lIll1IIl1 = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				local lIllIIl1II1lIlI1II1lI = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = nil;
				local lIlll1ll1lIlI11llIll11 = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 2];
				lIlll1ll1lIlI11llIll11[lIllIIl1II1lIlI1II1lI] = lIlI1l1I11l11lIll1IIl1;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 2;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l11I111llIll1lllI11ll then
				local lI11IllIIIIll1IIll111 = lIlI11I1IIllIll11Ill1I;
				local lIlIIIII1Il1llI1IIll = l1l1I1I1IllllI1111III;
				local lI11lI11ll111II11Il1l = {  };
				for l1Il1111ll1llII1I1I = lI11IllIIIIll1IIll111, 1, - 1 do
					lI11lI11ll111II11Il1l[l1Il1111ll1llII1I1I] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
					lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
					lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				end
				local IIIl11Il1llII11II1II1 = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				local l1I1I1I1Il1Il1Illl = l1lI1II1l1lll1lIlIlI1(IIIl11Il1llII11II1II1(l1Ill1lI1l1Il1IIlI(lI11lI11ll111II11Il1l, 1, lI11IllIIIIll1IIll111)));
				if lIlIIIII1Il1llI1IIll == 1 then
					lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
					lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = l1I1I1I1Il1Il1Illl[1];
				elseif lIlIIIII1Il1llI1IIll > 1 then
					for IIlIlIlI1I1lIII11l1III = 1, lIlIIIII1Il1llI1IIll do
						lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l + 1;
						lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = l1I1I1I1Il1Il1Illl[IIlIlIlI1I1lIII11l1III];
					end
				end
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIlIl1ll11llII1II1lIl1 then
				local I1l1lI11ll1I11IIlII11 = lIlI11I1IIllIll11Ill1I;
				if I1l1lI11ll1I11IIlII11 == 0 then
					return;
				elseif I1l1lI11ll1I11IIlII11 == 1 then
					return lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				else
					local lI11II11I1I1111IIll1l = {  };
					for I1I1Il1II11IIl11II11l = I1l1lI11ll1I11IIlII11, 1, - 1 do
						lI11II11I1I1111IIll1l[I1I1Il1II11IIl11II11l] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
						lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
						lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
					end
					return l1Ill1lI1l1Il1IIlI(lI11II11I1I1111IIll1l, 1, I1l1lI11ll1I11IIlII11);
				end
			elseif l1lI1II1II1l1I1lIIlll == l1l111ll1llllI1I1l1II then
				lI1l1llI1Il1IIlIlIl1 = lIlI11I1IIllIll11Ill1I;
			elseif l1lI1II1II1l1I1lIIlll == IIll1lIl1ll1llI11lIll1 then
				if not lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] then
					lI1l1llI1Il1IIlIlIl1 = lIlI11I1IIllIll11Ill1I;
				else
					lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
				end
			elseif l1lI1II1II1l1I1lIIlll == III111IIlIll1lIIIlll1 then
				if lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] then
					lI1l1llI1Il1IIlIlIl1 = lIlI11I1IIllIll11Ill1I;
				else
					lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
				end
			elseif l1lI1II1II1l1I1lIIlll == lIl11II11llIlIIlllI then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] + lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l11I1llII1I1IIIII1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] - lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l11l1III1IlI1IIlIl1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] * lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1I1IlllI1IlIllI1Il1I then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] / lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIlI11ll11lllI1l1IIlll then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] // lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lI1lllI1Ill1IllIIl1ll then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] % lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1l11IlI11I11ll11l1l1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] ^ lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == II1l1l11l11IlI1lIlIl1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] .. lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIl1Il1ll1IIllll1IlI then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] == lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIlII1111lI1l111llllII then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] ~= lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIIIIIIIIIIIllllI1I1l then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] < lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l11lIlI1lI111l1llI1l1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] <= lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1lI11I1l1I1IIllIIlI then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] > lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lII1ll1ll1llII11l1Il1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] >= lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIlI1llll11lI1II1I111l then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] & lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lI11l1l1IIIlIllllIlIl then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] | lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIlI11llIl1lIIlI1llll then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] ~ lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIII1I1lI1Il1lIIlII1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] << lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1lI1Il11lI11lll1Il1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] = lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l - 1] >> lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = nil;
				lIlllII1Il1lI11III1I1l = lIlllII1Il1lI11III1I1l - 1;
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIlIl11III1I1I1Illlll1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = - lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == l1IIl1I1I1111111l1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = not lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == lIllIIIIIII1lIlllIlI then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = # lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			elseif l1lI1II1II1l1I1lIIlll == IIIIl1IlIIlI1IllIII1 then
				lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l] = ~ lIlIlIIll11lIlII1111lI[lIlllII1Il1lI11III1I1l];
				lI1l1llI1Il1IIlIlIl1 = lI1l1llI1Il1IIlIlIl1 + 1;
			else
				return;
			end
		end
	end
end
print(lIIl1l1lIlIIll1IlllI1(2, 6))