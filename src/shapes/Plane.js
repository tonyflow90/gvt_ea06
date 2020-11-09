// BEGIN exercise plane
export let Plane = ( function() {

	function createVertexData() {
		let n = 100;
		let m = 100;

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

		let du = 20 / n;
		let dv = 20 / m;
		// Counter for entries in index array.
		let iLines = 0;
		let iTris = 0;

		// Loop u.
		for(let i = 0, u = -10; i <= n; i++, u += du) {
			// Loop v.
			for(let j = 0, v = -10; j <= m; j++, v += dv) {

				let iVertex = i * (m + 1) + j;

				let x = u;
				let y = 0;
				let z = v;

				// Set vertex positions.
				vertices[iVertex * 3] = x;
				vertices[iVertex * 3 + 1] = y;
				vertices[iVertex * 3 + 2] = z;

				// Calc and set normals.
				normals[iVertex * 3] = 0;
				normals[iVertex * 3 + 1] = 1;
				normals[iVertex * 3 + 2] = 0;

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
//END exercise plane