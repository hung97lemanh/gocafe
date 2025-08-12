import { NextApiRequest } from "next";

export interface NextApiRequestWithFile extends NextApiRequest {
    file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        destination: string;
        filename: string;
        path: string;
        size: number;
    };
}
