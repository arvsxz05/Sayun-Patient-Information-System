(function() {
    var extToMimes = {
        'pdf': 'pdf',
        'weba': 'audio',
        'webm': 'video',
        'webp': 'image',
        'adp': 'audio',
		'au': 'audio',
		'snd': 'audio',
		'mid': 'audio',
		'midi': 'audio',
		'kar': 'audio',
		'rmi': 'audio',
		'mp4a': 'audio',
		'm4a': 'audio',
		'm4p': 'audio',
		'mpga': 'audio',
		'mp2': 'audio',
		'mp2a': 'audio',
		'mp3': 'audio',
		'm2a': 'audio',
		'm3a': 'audio',
		'oga': 'audio',
		'ogg': 'audio',
		'spx': 'audio',
		'eol': 'audio',
		'dts': 'audio',
		'dtshd': 'audio',
		'lvp': 'audio',
		'pya': 'audio',
		'ecelp4800': 'audio',
		'ecelp7470': 'audio',
		'ecelp9600': 'audio',
		'aac': 'audio',
		'aif': 'audio',
		'aiff': 'audio',
		'aifc': 'audio',
		'm3u': 'audio',
		'wax': 'audio',
		'wma': 'audio',
		'ram': 'audio',
		'ra': 'audio',
		'rmp': 'audio',
		'wav': 'audio',
		"bmp": "image",
		"cgm": "image",
		"g3": "image",
		"gif": "image",
		"ief": "image",
		"jp2": "image",
		"jpeg": "image",
		"jpg": "image",
		"jpe": "image",
		"pict": "image",
		"pic": "image",
		"pct": "image",
		"png": "image",
		"btif": "image",
		"svg": "image",
		"svgz": "image",
		"tiff": "image",
		"tif": "image",
		"psd": "image",
		"djvu": "image",
		"djv": "image",
		"dwg": "image",
		"dxf": "image",
		"fbs": "image",
		"fpx": "image",
		"fst": "image",
		"mmr": "image",
		"rlc": "image",
		"mdi": "image",
		"npx": "image",
		"wbmp": "image",
		"xif": "image",
		"ras": "image",
		"cmx": "image",
		"fh": "image",
		"fhc": "image",
		"fh4": "image",
		"fh5": "image",
		"fh7": "image",
		"ico": "image",
		"pntg": "image",
		"pnt": "image",
		"mac": "image",
		"pcx": "image",
		"pnm": "image",
		"pbm": "image",
		"pgm": "image",
		"ppm": "image",
		"qtif": "image",
		"qti": "image",
		"rgb": "image",
		"xbm": "image",
		"xpm": "image",
		"xwd": "image",
		"3gp": "video",
		"3g2": "video",
		"h261": "video",
		"h263": "video",
		"h264": "video",
		"jpgv": "video",
		"jpm": "video",
		"jpgm": "video",
		"mj2": "video",
		"mjp2": "video",
		"mp4": "video",
		"mp4v": "video",
		"mpg4": "video",
		"m4v": "video",
		"webm": "video",
		"mpeg": "video",
		"mpg": "video",
		"mpe": "video",
		"m1v": "video",
		"m2v": "video",
		"ogv": "video",
		"qt": "video",
		"mov": "video",
		"fvt": "video",
		"mxu": "video",
		"m4u": "video",
		"pyv": "video",
		"viv": "video",
		"dv": "video",
		"dif": "video",
		"f4v": "video",
		"fli": "video",
		"flv": "video",
		"asf": "video",
		"asx": "video",
		"wm": "video",
		"wmv": "video",
		"wmx": "video",
		"wvx": "video",
		"avi": "video",
		"movie": "video",
		"ics": "text",
		"ifb": "text",
		"css": "text",
		"csv": "text",
		"html": "html",
		"htm": "html",
		"txt": "text",
		"text": "text",
		"conf": "text",
		"def": "text",
		"list": "text",
		"log": "text",
		"in": "text",
		"dsc": "text",
		"rtx": "text",
		"sgml": "text",
		"sgm": "text",
		"tsv": "text",
		"t": "text",
		"tr": "text",
		"roff": "text",
		"man": "text",
		"me": "text",
		"ms": "text",
		"uri": "text",
		"uris": "text",
		"urls": "text",
		"curl": "text",
		"dcurl": "text",
		"scurl": "text",
		"mcurl": "text",
		"fly": "text",
		"flx": "text",
		"gv": "text",
		"3dml": "text",
		"spot": "text",
		"jad": "text",
		"wml": "text",
		"wmls": "text",
		"s": "text",
		"asm": "text",
		"c": "text",
		"cc": "text",
		"cxx": "text",
		"cpp": "text",
		"h": "text",
		"hh": "text",
		"dic": "text",
		"f": "text",
		"for": "text",
		"f77": "text",
		"f90": "text",
		"p": "text",
		"pas": "text",
		"java": "text",
		"etx": "text",
		"uu": "text",
		"vcs": "text",
		"vcf": "text",
    }

    window.getMimeByExt = function(ext) {
        if (extToMimes.hasOwnProperty(ext)) {
            return extToMimes[ext];
        }
        return 'generic';
    }
})();