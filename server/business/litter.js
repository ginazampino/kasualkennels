module.exports = class LitterBusiness {
	constructor(conn) {
		this.conn = conn;
    };

    async create(request) {
        const body = request.body;
        const files = request.files;

        let family = files.family && files.family[0];

        family = await this.conn.insert("images", {
            file_name: family.filename
        });

        const entity = await this.conn.insert("litters", {
            litter_name: body.litter_name,
            requester: body.requester,
            description: body.description,
            image_id: family.insertId
        });

        return entity.insertId
    };

    delete(id) {
        const sql = `
            UPDATE litters
            SET active = 0
            WHERE id = ?
        `;
        
        return this.conn.query(sql, id);
    };

    getAll() {
        const sql = `
            SELECT
                litters.*
            ,   litters.active
            ,   litters.litter_name
            FROM
                litters
            WHERE
                active = 1
            ORDER BY
                litter_name;
        `;

        return this.conn.query(sql);
    };

    async getOne(id) {
        const sql = `
            SELECT
                litters.*
            ,   family.file_name as family_image
            FROM
                litters
            INNER JOIN
                images as family ON litters.image_id = family.id
            WHERE
                litters.id = ?
        `;

        let rows = await this.conn.query(sql, id);
        return rows && rows[0];
    };

    update(request) {
        const body = request.body;
        const files = request.files;

        let family = files.family && files.family[0];

        if (family) {
            this.conn.update("images", {
                file_name: family.filename
            }, {
                id: body.image_id
            });
        };

        this.conn.update("litters", {
            litter_name: body.litter_name,
            requester: body.requester,
            description: body.description
        }, { id: request.query.id });
    };

    async getLitters() {
        const litters = await this.conn.query(`
            SELECT
                litters.id
            ,   litters.active
            ,   litters.litter_name
            , 	litters.requester
            , 	litters.description
            ,	images.file_name as img
            FROM
                litters
            INNER JOIN
                images on litters.image_id = images.id
            WHERE
                litters.active = 1
        `);

        for (let i = 0; i < litters.length; i++) {
            let litter = litters[i];
            litter.pets = await this.getLitterPets(litter.id);
        };

        return { litters };
    };

    async getLitterPets(litterId) {
        const pets = await this.conn.query(`
            SELECT
                pets.pet_name
            ,   pets.active
            ,	pets.gender
            ,   pets.description
            ,   pets.litter_id
            ,   images.file_name as img
            FROM
                pets
            INNER JOIN
                images on pets.image_photo_id = images.id
            WHERE
                pets.litter_id = ?
            AND
                pets.active = 1
        `, litterId);

        return pets;
    };
};