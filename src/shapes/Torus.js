export let Torus = ( function() {

	function createVertexData() {
		let n = 16;
		let m = 32;

		// Positions.
		this.vertices = new Float32Array(3 * (n + 1) * (m + 1));
		let vertices = this.vertices;
		// Normals.
		this.normals = new Float32Array(3 * (n + 1) * (m + 1));
		let normals = this.normals;
		// Index data.
		this.indicesLines = new Uint16Array(2 * 2 * n * m);
		let indicesLines = this.indicesLines;
		this.indicesTris = new Uint16Array(3 * 2 * n * m);
		let indicesTris = this.indicesTris;

		let du = 2 * Math.PI / n;
		let dv = 2 * Math.PI / m;
		let r = 0.3;
		let R = 0.5;
		// Counter for entries in index array.
		let iLines = 0;
		let iTris = 0;

		// Loop angle u.
		for(let i = 0, u = 0; i <= n; i++, u += du) {
			// Loop angle v.
			for(let j = 0, v = 0; j <= m; j++, v += dv) {

				let iVertex = i * (m + 1) + j;

				let x = (R + r * Math.cos(u) ) * Math.cos(v);
				let y = (R + r * Math.cos(u) ) * Math.sin(v);
				let z = r * Math.sin(u);

				// Set vertex positions.
				vertices[iVertex * 3] = x;
				vertices[iVertex * 3 + 1] = y;
				vertices[iVertex * 3 + 2] = z;

				// Calc and set normals.
				let nx = Math.cos(u) * Math.cos(v);
				let ny = Math.cos(u) * Math.sin(v);
				let nz = Math.sin(u);
				normals[iVertex * 3] = nx;
				normals[iVertex * 3 + 1] = ny;
				normals[iVertex * 3 + 2] = nz;

				// if(i>14){
				// continue;
				// }

				// Set index.
				// Line on beam.
				if(j > 0 && i > 0) {
					indicesLines[iLines++] = iVertex - 1;
					indicesLines[iLines++] = iVertex;
				}
				// Line on ring.
				if(j > 0 && i > 0) {
					indicesLines[iLines++] = iVertex - (m + 1);
					indicesLines[iLines++] = iVertex;
				}

				// Set index.
				// Two Triangles.
				if(j > 0 && i > 0) {
					indicesTris[iTris++] = iVertex;
					indicesTris[iTris++] = iVertex - 1;
					indicesTris[iTris++] = iVertex - (m + 1);
					//
					indicesTris[iTris++] = iVertex - 1;
					indicesTris[iTris++] = iVertex - (m + 1) - 1;
					indicesTris[iTris++] = iVertex - (m + 1);
				}
			}
		}
		return { vertices: vertices, normals: normals, indicesLines: indicesLines, indicesTris: indicesTris };
	}

	return {
		createVertexData : createVertexData
	}

}());