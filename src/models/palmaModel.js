class Palma {
    constructor(data) {
        this.id = parseInt(data.id);
        this.lote = data.lote;
        this.linea = data.linea;
        this.palma = data.palma;
        this.estado = data.estado;
        this.codigo_estado = parseInt(data.codigo_estado);
        this.descarte = data.descarte === 'SI' || data.descarte === 'true';
        this.latitud = parseFloat(data.latitud);
        this.longitud = parseFloat(data.longitud);
        this.norte = parseFloat(data.norte);
        this.este = parseFloat(data.este);
        this.geom = `ST_SetSRID(ST_MakePoint(${data.longitud}, ${data.latitud}), 4326)`;
    }

    validate() {
        if (!this.id || isNaN(this.id)) {
            throw new Error('ID inválido');
        }
        if (isNaN(this.latitud) || isNaN(this.longitud)) {
            throw new Error('Coordenadas inválidas');
        }
        return true;
    }
}

module.exports = Palma;