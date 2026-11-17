"""Shrink a GLB's embedded textures to <=1024px JPEG (keeps geometry, rig and animations).
Usage: python3 -I scripts/shrink-glb.py in.glb out.glb [maxsize]"""
import json, struct, subprocess, sys, tempfile, os
src, out = sys.argv[1], sys.argv[2]
size = sys.argv[3] if len(sys.argv) > 3 else "1024"
b = open(src, "rb").read(); ln = struct.unpack("<I", b[12:16])[0]; j = json.loads(b[20:20 + ln])
o = 20 + ln; bl = struct.unpack("<I", b[o:o + 4])[0]; bin_ = b[o + 8:o + 8 + bl]
views = [bin_[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]] for v in j["bufferViews"]]
tmp = tempfile.mkdtemp()
for i, im in enumerate(j.get("images", [])):
    p = os.path.join(tmp, f"i{i}")
    open(p, "wb").write(views[im["bufferView"]])
    subprocess.run(["convert", p, "-resize", f"{size}x{size}>", "-quality", "85", p + ".jpg"], check=True)
    views[im["bufferView"]] = open(p + ".jpg", "rb").read(); im["mimeType"] = "image/jpeg"
nb = bytearray()
for v, data in zip(j["bufferViews"], views):
    while len(nb) % 4: nb.append(0)
    v["byteOffset"] = len(nb); v["byteLength"] = len(data); nb += data
while len(nb) % 4: nb.append(0)
j["buffers"][0]["byteLength"] = len(nb)
js = json.dumps(j, separators=(",", ":")).encode()
while len(js) % 4: js += b" "
with open(out, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(nb)))
    f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack("<II", len(nb), 0x004E4942)); f.write(nb)
tri = sum(j["accessors"][p.get("indices", p["attributes"]["POSITION"])]["count"] // 3 for m in j["meshes"] for p in m["primitives"])
print(f"{out}: {os.path.getsize(out)/1e6:.2f} MB, {tri} tris, {len(j.get('images', []))} textures, anims {[a.get('name') for a in j.get('animations', [])]}")
