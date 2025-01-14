import { NextFunction, Request, Response } from "express";

import { AuthService, Jwt } from "../../infrastructure";

export class AuthMiddleware {
  constructor(public readonly authService: AuthService) {}

  validateToken = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("Authorization");

    if (!header) return res.status(401).json({ message: "Token not provided" });
    if (!header.startsWith("Bearer "))
      return res.status(401).json({ message: "Invalid token" });

    const token = header.split(" ").at(1) || "";

    try {
      const payload: any = Jwt.verify(token);

      if (!payload) return res.status(401).json({ message: "Invalid token" });

      const user = await this.authService.findUser(payload.id);

      if (!user) return res.status(401).json("Invalid token");

      req.body.userId = user.id;
      req.body.userRole = user.role;

      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError")
        return res
          .status(401)
          .json({ message: "Token expired, generate a new one" });

      if (error.statusCode === 404)
        return res.status(401).json({
          message: "Invalid token, generate a new one",
        });

      console.error({ error: JSON.stringify(error) });

      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
