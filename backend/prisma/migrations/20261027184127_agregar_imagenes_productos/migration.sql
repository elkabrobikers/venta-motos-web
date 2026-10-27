-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "imagen" BYTEA,
ADD COLUMN     "imagenTipo" TEXT NOT NULL DEFAULT '';
