<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->enum('bank_name', ['CIH', 'ATTIJARI', 'OTHER']);
            $table->string('receipt_image', 500);
            $table->string('reference_number', 100)->nullable();
            $table->enum('status', ['PENDING', 'VALIDATED', 'REJECTED'])->default('PENDING');
            $table->text('admin_notes')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
            
            $table->index(['seller_id']);
            $table->index(['status']);
            $table->index(['reference_number']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
