<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('segment');
            $table->json('countries');
            $table->json('states');
            $table->string('cities')->nullable();
            $table->string('language')->default('Português');
            $table->unsignedBigInteger('target_product_id');
            $table->integer('limit_daily')->default(50);
            $table->string('status')->default('idle');
            $table->integer('progress')->default(0);
            $table->string('current_step')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('target_product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
